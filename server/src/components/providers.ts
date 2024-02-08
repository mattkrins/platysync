import * as fs from 'fs';
import Papa, { ParseResult } from 'papaparse';
import { getSchema } from '../routes/schema.js';
import eduSTAR from '../modules/eduSTAR.js';
import { Hash, decrypt } from '../modules/cryptography.js';
import { PROXY, CSV as CSVProvider, LDAP as LDAPProvider } from '../typings/providers.js';
import ldap from '../modules/ldap.js';

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
    schema: string;
    school: string;
    proxy?: URL|string;
    eduhub?: string;
    constructor(schema: string, school: string, proxy?: string, eduhub?: string) {
        this.schema = schema;
        this.school = school;
        this.proxy = proxy;
        this.eduhub = eduhub;
    }
    async configure(): Promise<eduSTAR> {
        const schema = getSchema(this.schema);
        if (this.proxy && String(this.proxy).trim()!==""){
            if (!schema._connectors[String(this.proxy)]) throw Error(`Connector '${this.proxy}' does not exist.`);
            const connector = schema._connectors[String(this.proxy)] as PROXY;
            const url = new URL(connector.url);
            if (connector.username) url.username = connector.username;
            if (connector.password) url.password = await decrypt(connector.password as Hash);
            this.proxy = url;
        }
        let data;
        if (this.eduhub){
            if (!schema._connectors[this.eduhub]) throw Error(`Connector '${this.eduhub}' does not exist.`);
            const connector = schema._connectors[this.eduhub] as CSVProvider;
            const csv = new CSV(connector.path);
            data = await csv.open() as { data: {[k: string]: string}[] };
        }
        return new eduSTAR({
            school: this.school,
            proxy: this.proxy,
            eduhub: data?.data
        });
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