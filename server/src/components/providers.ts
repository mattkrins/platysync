import * as fs from 'fs';
import { Schema, connection, connections } from "../typings/common.js";
import Papa, { ParseResult } from 'papaparse';
import eduSTAR from '../modules/eduSTAR.js';
import { Hash, decrypt } from '../modules/cryptography.js';
import { PROXY, anyProvider, CSV as CSVProvider, STMC as STMCProvider, LDAP as LDAPProvider } from '../typings/providers.js';
import ldap from '../modules/ldap.js';
import { server } from '../server.js';

export default async function connect(schema: Schema, connectorName: string, connections: connections, id: string, caseSen = false): Promise<connection> {
    if (connections[connectorName]) return connections[connectorName];
    const provider = schema._connectors[connectorName] as anyProvider;
    server.io.emit("job_status", `Connecting to ${connectorName}`);
    let connection: connection = {rows:[], keyed: {}, provider};
    switch (provider.id) {
        case 'stmc': {
            const stmc = new STMC(schema, provider as STMCProvider);
            const client = await stmc.configure();
            const users = await client.getUsers();
            const keyed: {[k: string]: object} = {};
            const rows = [];
            for (const row of users){
                if (keyed[row[id]]) continue;
                keyed[caseSen?row[id]:row[id].toLowerCase()] = row;
                rows.push(row);
            }
            connection = { rows: users, provider, keyed }; break;
        }
        case 'csv': {
            const csv = new CSV(undefined, undefined, provider as CSVProvider );
            const data = await csv.open() as { data: {[k: string]: string}[] };
            const keyed: {[k: string]: object} = {};
            const rows = [];
            for (const row of data.data){
                if (keyed[row[id]]) continue; //REVIEW - skips non-unqiue rows; what should happen here? 
                keyed[caseSen?row[id]:row[id].toLowerCase()] = row;
                rows.push(row);
            } data.data = [];
            connection = { rows, provider, keyed }; break;
        }
        case 'ldap': {
            const prov = provider as LDAPProvider;
            const ldap = new LDAP(prov);
            const client = await ldap.configure();
            //const { users, keyed } = await client.search(ldap.attributes, (prov.filter && prov.filter.trim()!=='') ? prov.filter : undefined);
            const { users, keyed } = await client.search(ldap.attributes, id, caseSen);
            const close = async () => client.close();
            connection = { rows: users, keyed, provider, close }; break;
        }
        default: throw Error("Unknown connector.");
    } connections[connectorName] = connection; return connection;
}

export class CSV {
    private path: string;
    private encoding: BufferEncoding = 'utf8';
    constructor(path?: string, encoding?: BufferEncoding, connector?: CSVProvider) {
        this.path = connector ? connector.path : (path || '');
        this.encoding = connector ? connector.encoding : (encoding || 'utf8');
    }
    open(header=true, autoClose=true): Promise<ParseResult<unknown>> {
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

export class STMC {
    schema: Schema;
    connector: STMCProvider;
    proxy?: URL|string;
    eduhub?: string;
    constructor(schema: Schema, connector: STMCProvider) {
        this.schema = schema;
        this.connector = connector;
        this.proxy = connector.proxy;
        this.eduhub = connector.eduhub;
    }
    async configure(): Promise<eduSTAR> {
        if (this.proxy && String(this.proxy).trim()!==""){
            if (!this.schema._connectors[String(this.proxy)]) throw Error(`Connector '${this.proxy}' does not exist.`);
            const connector = this.schema._connectors[String(this.proxy)] as PROXY;
            const url = new URL(connector.url);
            if (connector.username) url.username = connector.username;
            if (connector.password) url.password = await decrypt(connector.password as Hash);
            this.proxy = url;
        }
        let data;
        if (this.eduhub){
            if (!this.schema._connectors[this.eduhub]) throw Error(`Connector '${this.eduhub}' does not exist.`);
            const connector = this.schema._connectors[this.eduhub] as CSVProvider;
            const csv = new CSV(connector.path);
            data = await csv.open() as { data: {[k: string]: string}[] };
        }
        const client = new eduSTAR({
            school: this.connector.school,
            proxy: this.proxy,
            eduhub: data?.data
        });
        const password = await decrypt(this.connector.password as Hash);
        await client.login(this.connector.username, password);
        return client;
    }
}

export class LDAP {
    private mustHave = ['sAMAccountName', 'userPrincipalName', 'cn', 'uid', 'distinguishedName', 'userAccountControl', 'memberOf'];
    public attributes: string[] = this.mustHave;
    private connector: LDAPProvider;
    constructor(connector: LDAPProvider) {
        this.connector = connector;
    }
    async configure(): Promise<ldap> {
        const client = new ldap();
        await client.connect(this.connector.url);
        const password = await decrypt(this.connector.password as Hash);
        await client.login(this.connector.username, password);
        let base: string = this.connector.dse || await client.getRoot();
        if (!base || base.trim()==='') throw Error("Root DSE is empty.");
        if ((this.connector.base||'')!=='') base = `${this.connector.base},${base}`;
        client.base = base;
        if (this.connector.attributes.length>0) {
            this.attributes = this.connector.attributes;
            for (const a of this.mustHave) if (!this.attributes.includes(a)) this.attributes.push(a);
        }
        return client;
    }
}