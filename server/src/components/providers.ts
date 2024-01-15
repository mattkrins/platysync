import * as fs from 'fs';
import Papa from 'papaparse';
import { getSchema } from '../routes/schema.js';
import eduSTAR from '../modules/eduSTAR.js';
import { Hash, decrypt } from '../modules/cryptography.js';
import { PROXY, CSV as CSVProvider } from '../typings/providers.js';

export class CSV {
    path: string;
    encoding: BufferEncoding = 'utf8';
    constructor(path: string, encoding?: BufferEncoding) {
        this.path = path;
        this.encoding = encoding || 'utf8';
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    open(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                const file = fs.createReadStream(this.path, this.encoding);
                Papa.parse(file, {
                    header: true,
                    complete: resolve,
                    error: reject
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

