import { xError } from "../../modules/common.js";
import { base_provider, base_provider_options } from "./base.js";
import * as fs from 'fs';
import Papa, { ParseResult } from "papaparse";
import { compile } from "../../modules/handlebars.js";
import { Doc } from "../../db/models.js";
import { paths } from "../../server.js";
import { template } from "../../typings/common.js";
import { Schema } from "../models.js";

export interface csv_options extends base_provider_options {
    path: string;
    encoding?: BufferEncoding;
    schema?: Schema;
}

export default class CSV extends base_provider {
    private path: string;
    private schema?: Schema;
    private encoding: BufferEncoding = 'utf8';
    constructor(options: csv_options) {
        super(options);
        this.path = options.path;
        this.schema = options.schema;
        this.encoding = options.encoding||'utf8';
    }
    public async validate(): Promise<true> {
        if (!this.path) throw new xError("Path can not be empty.", "path");
        await this.configure();
        if (!this.path || !fs.existsSync(this.path)) throw new xError("Path does not exist.", "path");
        if (!(fs.lstatSync(this.path as string).isFile())) throw new xError("Path is not a file.", "path");
        await this.open();
        return true;
    }
    public async configure() {
        const docsTemplate: template = { $file: {} };
        if (this.schema){
            const docs = await Doc.findAll({where: { schema: this.schema.name }, raw: true });
            for (const doc of docs) {
                const path = `${paths.storage}/${this.schema.name}/${doc.id}${doc.ext?`.${doc.ext}`:''}`;
                (docsTemplate.$file as { [k: string]: string })[doc.name] = path;
            }
            this.path = compile(docsTemplate, this.path);
        }
    }
    public async getHeaders(): Promise<string[]> {
        const data = await this.open() as { data: {[k: string]: string}[], meta: { fields: string[] } };
        return data.meta.fields || [];
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