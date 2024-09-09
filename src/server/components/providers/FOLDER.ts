import { paths } from "../../..";
import { hasLength, validate, xError } from "../../modules/common";
import { compile } from "../../modules/handlebars";
import { base_provider, base_provider_options } from "./base";
import * as fs from 'fs';

interface folder {
    name: string,
    type: string,
    size: string,
    created: string,
    modified: string,
    accessed: string,
    [k: string]: string;
}

export interface folder_options extends base_provider_options {
    path: string;
    type?: string;
}

export default class FOLDER extends base_provider {
    private contents: folder[] = [];
    private path: string;
    private type: string = 'file';
    constructor(options: folder_options) {
        super(options);
        this.path = options.path;
        this.type = options.type || 'file';
    }
    public async validate() {
        validate( this, {
            path: hasLength({ min: 4 }, 'Path must be at least 4 characters long.'),
        });
        if (!this.path || !fs.existsSync(this.path)) throw new xError("Path does not exist.", "path", 404);
        if (!(fs.lstatSync(this.path as string).isDirectory())) throw new xError("Path is not a directory.", "path");
    }
    public async initialize() {
        const docsTemplate: template = { $file: {} };
        for (const file of this.schema.files) {
            const folder = `${paths.storage}/${this.schema.name}`;
            const path = `${folder}/${file.path}`;
            (docsTemplate.$file as { [k: string]: string })[file.key||file.name] = path;
        } this.path = compile(docsTemplate, this.path);
    }
    public async configure(): Promise<void> {
        for (const name of fs.readdirSync(this.path)){
            const stats = fs.statSync(`${this.path}/${name}`);
            const type = stats.isFile() ? 'file' : stats.isDirectory() ? 'directory' : 'unknown';
            if (this.type!=="both" && this.type!==type) continue;
            const folder: Partial<folder> = { name, type };
            if (this.headers.includes("size")) folder.size = String(stats.blksize);
            if (this.headers.includes("created")) folder.created = String(stats.ctime);
            if (this.headers.includes("modified")) folder.modified = String(stats.mtime);
            if (this.headers.includes("accessed")) folder.accessed = String(stats.atime);
            this.contents.push(folder as folder);
        }
    }
    public async getHeaders(): Promise<string[]> {
        return ['name', 'type', 'size', 'created', 'modified', 'accessed',];
    }
    public async connect(): Promise<{ [k: string]: string }[]> {
        this.data = this.contents;
        return this.contents;
    }
}
