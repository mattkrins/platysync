import * as fs from 'fs';
import { paths, version } from '../server.js';
import YAML, { stringify } from 'yaml'
import { xError, validStr } from '../modules/common.js';

class Rule {
    constructor() {
        
    }
    public async save() {

    }
}

class Connnector {
    constructor() {
        
    }
    public async save() {

    }
}

interface xSchema {
    name: string;
    version: string;
    connnectors: Connnector[];
    rules: Rule[];
    [k: string]: unknown;
}
export class Schema {
    public name: string;
    public version: string;
    public connnectors: Connnector[] = [];
    public rules: Rule[] = [];
    private parent: Schemas;
    constructor(schema: Schema|xSchema, parent: Schemas) {
        this.parent = parent;
        this.name = schema.name;
        this.version = schema.version;
        for (const connnector of schema.connnectors||[]) this.connnectors.push(connnector);
        for (const rule of schema.rules||[]) this.rules.push(rule);
    }
    public save(write: boolean = true): Schema {
        const clean = {
            name: this.name,
            version: this.version,
            connnectors: this.connnectors,
            rules: this.rules,
        };
        if (write) fs.writeFileSync(`${paths.schemas}/${this.name}.yaml`, stringify(clean));
        if (this.name in this.parent.object) {
            this.parent.array = this.parent.array.map(schema=>schema.name===this.name?this:schema);
        } else { this.parent.array.push(this); }
        this.parent.object[this.name] = this;
        return this;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public mutate(changes: {[k: string]: any}, save: boolean = true): Schema {
        console.log(changes.name, this.name)
        if (changes.name && changes.name !== this.name){
            if ((changes.name in this.parent.object)) throw new xError("Name taken.", "name", 409);
            this.destroy();
        }
        Object.keys(changes).forEach(key => {
            this[key as keyof Schema] = changes[key]
        }); if (save) { this.save(); } return this;
    }
    public destroy(): true {
        fs.unlinkSync(`${paths.schemas}/${this.name}.yaml`);
        delete this.parent.object[this.name];
        this.parent.array = this.parent.array.filter(schema=>schema.name!=this.name);
        return true
    }
    public parse(): xSchema {
        const keys = Object.keys(this).filter(key =>!['constructor', 'parent'].includes(key));
        const keyValueObject: xSchema = { name: this.name, version: this.version, connnectors: this.connnectors, rules: this.rules };
        keys.forEach(key => {
            keyValueObject[key] = this[key as keyof Schema];
        }); return keyValueObject;
    }
}
export class Schemas {
    public array: Schema[] = [];
    public object: { [name: string]: Schema } = {};
    public headers: { [connector: string]: string[] } = {};
    public async load(spec?: string) {
        const files = fs.readdirSync(`${paths.schemas}/`).filter(name=>name.includes('.yaml')||name.includes('.yml'));
        for (const name of files){
            if (spec && name.split('.')[0] !== spec ) continue;
            const file = fs.readFileSync(`${paths.schemas}/${name}`, 'utf8');
            const parsed = YAML.parse(file) as Schema;
            const schema = new Schema(parsed, this);
            schema.save(false);
        }
    }
    public create(schema: Schema|xSchema): Schema {
        if (!validStr(schema.name)) throw new xError("Name can not be empty.", "name");
        if ((schema.name in this.object)) throw new xError("Name taken.", "name", 409);
        const regex = /[\W\s]|^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
        if (regex.test(schema.name)) throw new xError("Invalid name format.", "name");
        schema.version = version||"0";
        const created = new Schema(schema, this);
        return created.save();
    }
    public getAll(parse?: false): Schema[];
    public getAll(parse?: true): xSchema[];
    public getAll(parse: boolean = false): Schema[]|xSchema[] {
        return parse ? this.array.map(s=>s.parse()) : this.array;
    }
    public get(name: string, parse?: false): Schema;
    public get(name: string, parse?: true): xSchema;
    public get(name: string, parse: boolean = false): Schema|xSchema {
        if (!(name in this.object)) throw new xError("Schema not found.", "name", 404);
        return parse ? this.object[name].parse() : this.object[name];
    }
}

