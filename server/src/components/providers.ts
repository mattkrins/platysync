import * as fs from 'fs';
import { connection, connections, template } from "../typings/common.js";
import Papa, { ParseResult } from 'papaparse';
import eduSTAR from '../modules/eduSTAR.js';
import { Hash, decrypt } from '../modules/cryptography.js';
import ldap from '../modules/ldap.js';
import { paths, server } from '../server.js';
import { AxiosFix } from "../typings/common.js";
import axios from 'axios';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Doc } from '../db/models.js';
import { compile } from '../modules/handlebars.js';
import { xError } from '../modules/common.js';
import { Schema, ConnectorX, Connectors } from './models.js';
const Axios = (axios as unknown as AxiosFix);

interface connectorConfig {[k: string]: unknown}
export default async function connect(schema: Schema, connectorName: string, connections: connections, id: string, config: connectorConfig = {}, caseSen = false): Promise<connection> {
    if (connections[connectorName]) return connections[connectorName];
    const connectors = new Connectors(schema.name);
    const provider = connectors.get(connectorName);
    server.io.emit("job_status", `Connecting to ${connectorName}`);
    let connection: connection = {rows:[], keyed: {}, provider};
    switch (provider.id) {
        case 'stmc': {
            const stmc = new STMC({...provider, schema, ...config} as STMCOptions);
            const client = await stmc.configure();
            const users = await client.getUsers();
            const keyed: {[k: string]: object} = {};
            const rows = [];
            for (const row of users){ //TODO - move to connect func, put classes into object lookup
                if (keyed[row[id]]) continue;
                keyed[caseSen?row[id]:row[id].toLowerCase()] = row;
                rows.push(row);
            }
            connection = { rows: users, provider, client, keyed }; break;
        }
        case 'csv': {
            const csv = new CSV({...provider, ...config} as CSVOptions );
            const data = await csv.open() as { data: {[k: string]: string}[] };
            const keyed: {[k: string]: object} = {};
            const rows = [];
            for (const row of data.data){
                if (keyed[row[id]]) continue;
                keyed[caseSen?row[id]:row[id].toLowerCase()] = row;
                rows.push(row);
            } data.data = [];
            connection = { rows, provider, keyed }; break;
        }
        case 'ldap': {
            const ldap = new LDAP({...provider, ...config} as LDAPOptions);
            const client = await ldap.configure();
            const { users, keyed } = await client.search(ldap.attributes, id, caseSen);
            const close = async () => client.close();
            connection = { rows: users, keyed, provider, client, close }; break;
        }
        default: throw new xError("Unknown connector.");
    } connections[connectorName] = connection; return connection;
}

export class ProviderBase {
    public id: string;
    public name: string;
    public password?: string|Hash;
    [name: string]: unknown;
    constructor(options: AllProviderOptions) {
        this.id = options.id;
        this.name = options.name;
    }
    public async getHeaders(): Promise<string[]> { return [] }
}

export interface PROXYOptions extends Provider {
    schema: Schema;
    name: string;
    username?: string;
    password?: string|Hash;
}
export class PROXY extends ProviderBase {
    private schema: Schema;
    public name: string;
    public url?: URL;
    constructor(options: PROXYOptions) {
        super(options);
        this.schema = options.schema;
        this.name = options.name;
    }
    async validate(): Promise<true> {
        if (!this.schema) throw new xError('Schema can not be empty.');
        if (!this.url) throw new xError('URL can not be empty.', 'url');
        await this.configure();
        const response = await Axios.default.get('https://www.example.com/', {
            httpAgent: new HttpProxyAgent(this.url),
            httpsAgent: new HttpsProxyAgent(this.url),
            proxy: false as const
        });
        if (!response || !response.data) throw new xError('No data returned.');
        if (!response.data.includes("Example Domain")) throw new xError('Unexpected malformed data.');
        return true;
    }
    public async configure(): Promise<URL> {
        const connectors = new Connectors(this.schema.name);
        const connector = connectors.get(this.name) as ConnectorX as PROXYOptions;
        const url = new URL(connector.url as string);
        if (connector.username) url.username = connector.username;
        if (connector.password) url.password = await decrypt(connector.password as Hash);
        this.url = url;
        return url;
    }
}

export interface CSVConfig {
}
export interface CSVOptions extends Provider, CSVConfig {
    path: string;
    encoding?: BufferEncoding;
    schema?: Schema;
}
export class CSV extends ProviderBase {
    private path: string;
    private schema?: Schema;
    private encoding: BufferEncoding = 'utf8'; //TODO - add config to GUI
    constructor(options: CSVOptions) {
        super(options);
        this.path = options.path;
        this.schema = options.schema;
        this.encoding = options.encoding||'utf8';
    }
    public async getHeaders(): Promise<string[]> {
        const data = await this.open() as { data: {[k: string]: string}[], meta: { fields: string[] } };
        return data.meta.fields || [];
    }
    public async validate(): Promise<true> {
        if (!this.path) throw new xError("Path can not be empty.", "path");
        await this.configure();
        if (!this.path || !fs.existsSync(this.path)) throw new xError("Path does not exist.", "path");
        if (!(fs.lstatSync(this.path as string).isFile())) throw new xError("Path is not a file.", "path");
        await this.open();
        return true;
    }
    private async configure() {
        const docsTemplate: template = { $file: {} };
        if (this.schema){
            const docs = await Doc.findAll({where: { schema: this.schema.name }, raw: true });
            for (const doc of docs) {
                const path = `${paths.storage}/${this.schema.name}/${doc.id}${doc.ext?`.${doc.ext}`:''}`;
                (docsTemplate.$file as { [k: string]: string })[doc.name] = path;
            }
        }
        this.path = compile(docsTemplate, this.path);
    }
    public async open(header=true, autoClose=true): Promise<ParseResult<unknown>> {
        await this.configure();
        return new Promise((resolve, reject) => {
            try {
                const file = fs.createReadStream(this.path, this.encoding);
                Papa.parse(file, {
                    header,
                    complete: (result: Papa.ParseResult<unknown> | PromiseLike<Papa.ParseResult<unknown>>) => {
                        if (autoClose) file.close();
                        return resolve(result);
                    },
                    error: (reason?: unknown) => {
                        if (autoClose) file.close();
                        return reject(reason);
                    }
                });
            } catch (e) { reject(e); }
        });
    }
}

export interface LDAPConfig extends connectorConfig {
    filter?: string;
}
export interface LDAPOptions extends Provider, LDAPConfig {
    url: string;
    username: string;
    password: string|Hash;
    attributes: string[];
    dse?: string;
    base?: string;
}
export class LDAP extends ProviderBase {
    private mustHave = ['sAMAccountName', 'userPrincipalName', 'cn', 'uid', 'distinguishedName', 'userAccountControl', 'memberOf'];
    public attributes: string[] = this.mustHave;
    private url: string;
    private username: string;
    public password: string|Hash;
    private filter?: string;
    private dse?: string;
    private base?: string;
    constructor(options: LDAPOptions) {
        super(options);
        this.url = options.url;
        this.username = options.username;
        this.password = options.password;
        this.attributes = options.attributes;
        this.filter = options.filter;
        this.dse = options.dse;
        this.base = options.base;
    }
    async validate(): Promise<true> {
        if (!this.url) throw new xError('URL can not be empty.', 'url');
        if (!this.username) throw new xError('Username can not be empty.', 'username');
        if (!this.password) throw new xError('Password can not be empty.', 'password');
        if (!this.attributes || this.attributes.length <= 0) throw new xError('Attributes can not be empty.');
        if (typeof this.password === 'object'){
            if (!(this.password as Hash).encrypted) throw new xError('Password malformed.', 'password');
            if (!(this.password as Hash).iv) throw new xError('Password malformed.', 'password');
        }
        await this.configure();
        return true;
    }
    public async configure(): Promise<ldap> {
        const client = new ldap();
        if (this.filter) client.filter = this.filter;
        await client.connect(this.url);
        const password = await decrypt(this.password as Hash);
        await client.login(this.username, password);
        let base: string = this.dse || await client.getRoot();
        if (!base || base.trim()==='') throw new xError("Root DSE is empty.");
        if ((this.base||'')!=='') base = `${this.base},${base}`;
        client.base = base;
        this.getAttributes();
        return client;
    }
    public async getHeaders(): Promise<string[]> {
        return this.getAttributes();
    }
    private getAttributes(): string[] {
        this.attributes = this.attributes||[];
        for (const a of this.mustHave) if (!this.attributes.includes(a)) this.attributes.push(a);
        this.attributes = this.attributes.filter((b, index, self) => index === self.findIndex((a) => ( a === b )) );
        return this.attributes;
    }
}

export interface STMCConfig extends connectorConfig {
    match?: string;
    inactive?: boolean;
}
export interface STMCOptions extends Provider, STMCConfig {
    username: string;
    password: string|Hash;
    school: string;
    schema: Schema;
    proxy?: string;
    cache?: string;
}
export class STMC extends ProviderBase {
    private schema: Schema;
    private school: string;
    private username: string;
    public password: string|Hash;
    private proxy?: string|PROXY;
    private cache?: number = 1440;
    private match?: string;
    private inactive?: boolean = false;
    constructor(options: STMCOptions) {
        super(options);
        this.username = options.username;
        this.password = options.password;
        this.school = options.school;
        this.schema = options.schema;
        this.proxy = options.proxy;
        this.cache = Number(options.cache||"1440");
        this.match = options.match;
        this.inactive = options.inactive;
    }
    public async validate(): Promise<true> {
        if (!this.schema) throw new xError('Schema can not be empty.', 'schema');
        if (!this.school) throw new xError('School can not be empty.', 'school');
        if (!this.username) throw new xError('Username can not be empty.', 'username');
        if (!this.password) throw new xError('Password can not be empty.', 'password');
        await this.configure();
        return true;
    }
    public async configure(): Promise<eduSTAR> {
        if (this.proxy && String(this.proxy).trim()!==""){
            this.proxy = new PROXY({ schema: this.schema, name: this.proxy as string, id: '' })
            await this.proxy.configure();
        }
        const eduhub = this.match ? (await this.eduhub(this.match)).data : undefined;
        const client = new eduSTAR({
            school: this.school,
            proxy: this.proxy ? (this.proxy as PROXY).url : undefined,
            inactive: this.inactive,
            cache: this.cache,
            eduhub
        });
        const password = await decrypt(this.password as Hash);
        await client.login(this.username, password);
        return client;
    }
    public async getHeaders(): Promise<string[]> {
        return ['_class', '_cn', '_desc', '_disabled', '_displayName', '_dn', '_firstName',
        '_google', '_intune', '_lastLogon', '_lastName', '_lastPwdResetViaMC', '_lockedOut',
        '_login', '_o365', '_pwdExpired', '_pwdExpires', '_pwdLastSet',
        '_pwdNeverExpires', '_pwdResetAction', '_pwdResetTech', '_yammer', '_eduhub' ];
    }
    private async eduhub(name: string): Promise<{ data: {[k: string]: string}[] }> {
        const connectors = new Connectors(this.schema.name);
        const connector = connectors.get(name) as ConnectorX as CSVOptions;
        const csv = new CSV(connector);
        return await csv.open() as { data: {[k: string]: string}[] };
    }
}

export interface Provider {
    id: string;
    name: string;
    password?: string|Hash;
    [name: string]: unknown;
}
export type AllProviderOptions = PROXYOptions|CSVOptions|LDAPOptions|STMCOptions;
export interface ProviderOptions { proxy: PROXYOptions, csv: CSVOptions, ldap: LDAPOptions, stmc: STMCOptions }
export type AllProviders = PROXY|CSV|LDAP|STMC;
export type AllProviderTypes = typeof PROXY|typeof CSV|typeof LDAP|typeof STMC;
export interface Providers { csv: CSV, stmc: STMC, ldap: LDAP, proxy: PROXY }
export const providers: { [id: string]: AllProviderTypes } = { csv: CSV, stmc: STMC, ldap: LDAP, proxy: PROXY };