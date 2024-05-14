import { xError } from "../../modules/common.js";
import { base_provider, base_provider_options } from "./base.js";
import * as fs from 'fs';

interface folder {
    name: string,
    type: string,
    size: string,
    created: string,
    modified: string,
    accessed: string,
    [k: string]: string,
}

export interface folder_options extends base_provider_options {
    path: string;
    type: string;
}

export default class FOLDER extends base_provider {
    public contents: folder[] = [];
    private path: string = '';
    private type: string = 'both';
    constructor(options: folder_options) {
        super(options);
        this.path = options.path||'';
        this.type = options.type||'both';
    }
    async validate(): Promise<true> {
        if (!this.path || !fs.existsSync(this.path)) throw new xError("Path does not exist.", "path");
        return true;
    }
    public async configure(): Promise<void> {
        for (const name of fs.readdirSync(this.path)){
            const stats = fs.statSync(`${this.path}/${name}`);
            const type = stats.isFile() ? 'file' : stats.isDirectory() ? 'directory' : 'unknown';
            if (this.type!=="both" && this.type!==type) continue;
            this.contents.push({
                name,
                type,
                size: String(stats.blksize),
                created: String(stats.ctime),
                modified: String(stats.mtime),
                accessed: String(stats.atime),
            })
        }
    }
    public async getHeaders(): Promise<string[]> {
        return ['name', 'type', 'size', 'created', 'modified', 'accessed',];
    }
}