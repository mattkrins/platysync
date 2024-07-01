import { paths } from "../../../server";
import { hasLength, isAlphanumeric, validate, xError } from "../../modules/common";
import { compile } from "../../modules/handlebars";
import { base_provider, base_provider_options } from "./base";
import * as fs from 'fs';
import Papa, { ParseResult } from "papaparse";

export interface csv_options extends base_provider_options {
    path: string;
    encoding?: BufferEncoding;
    noHeaders?: boolean;
}

export default class CSV extends base_provider {
    private path: string;
    private encoding: BufferEncoding;
    private noHeaders: boolean;
    constructor(options: csv_options) {
        super(options);
        this.path = options.path;
        this.encoding = options.encoding || 'utf8';
        this.noHeaders = options.noHeaders || false;
    }
    public async validate() {
        validate( this, {
            name: isAlphanumeric('Name can only contain alphanumeric characters.'),
            path: hasLength({ min: 4 }, 'Path must be at least 4 characters long.'),
        });
        if (!this.path || !fs.existsSync(this.path)) throw new xError("Path does not exist.", "path", 404);
        if (!(fs.lstatSync(this.path as string).isFile())) throw new xError("Path is not a file.", "path");
        await this.open();
    }
    public async preConfigure() {
        const docsTemplate: template = { $file: {} };
        for (const file of this.schema.files) {
            const folder = `${paths.storage}/${this.schema.name}`;
            const path = `${folder}/${file.path}`;
            (docsTemplate.$file as { [k: string]: string })[file.key||file.name] = path;
        } this.path = compile(docsTemplate, this.path);
    }
    public async getHeaders(): Promise<string[]> {
        if (this.noHeaders) return [];
        const content = await this.open();
        return content.meta.fields || [];
    }
    public async connect(foreign_key?: string) {
        const data = await this.open() as { data: {[k: string]: string}[] };
        const rows = [];
        const keyed: {[foreign_key: string]: object} = {};
        for (const row of data.data){ // row = {STKEY: "KRI0001",ETC:"TEST"}
            if (foreign_key) {
                const foreign_data = row[foreign_key];
                keyed[foreign_data] = row;
            } rows.push(row);
        } return { rows, keyed };
    }
    //public async Connect(foreign_key?: string, primary_data?: string) {
    //    const data = await this.open() as { data: {[k: string]: string}[] };
    //    const rows = [];
    //    // foreign_key = STKEY
    //    for (const row of data.data){ // row = {STKEY: "KRI0001",ETC:"TEST"}
    //        if (foreign_key && (!row[foreign_key] || row[foreign_key]!==primary_data) ) continue;
    //        rows.push(row);
    //    }
    //}
    public async open(autoClose=true): Promise<ParseResult<unknown>> {
        return new Promise((resolve, reject) => {
            try {
                const file = fs.createReadStream(this.path, this.encoding);
                Papa.parse(file, {
                    header: !this.noHeaders,
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
