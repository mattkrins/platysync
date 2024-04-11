import * as fs from 'fs';
import { paths, version } from '../server.js';
import YAML, { stringify } from 'yaml'
import { xError, validStr } from '../modules/common.js';
import { providers } from './providers.js';
import { schemas } from '../routes/schema.js';
import { encrypt } from '../modules/cryptography.js';

function parse(object: unknown, func?: (k: string, v: unknown) => unknown ) {
    return JSON.parse(JSON.stringify(object, func ? func : function(k, v) {
        if(k == 'parent') return undefined;
        return v;
    }));
}

export interface Condition {
    type: string;
    key: string;
    operator: string;
    value: string;
    delimiter: '' | ',' | ';' | '|' | 'tab' | ' ';
}

export interface Attribute {
    name: string;
    value: string;
}

export interface Action {
    name: string;
    value?: string;
    source?: string;
    target?: string;
    cn?: string;
    sam?: string;
    password?: string;
    upn?: string;
    ou?: string;
    attributes?: Attribute[];
    groups?: unknown[];
    conditions?: Condition[];
    templates?: { name: string, value: string }[];
}
interface secondary {
    id: string;
    primary: string;
    secondaryKey: string;
    primaryKey: string;
    case?: boolean;
    req?: boolean;
    oto?: boolean;
}
interface xRule {
    name: string;
    display: string;
    enabled: boolean;
    position: number;
    primary: string;
    primaryKey: string;
    [k: string]: unknown;
}
export class Rule {
    public name: string;
    public display: string;
    public enabled: boolean;
    public position: number;
    public primary: string;
    public primaryKey: string;
    public secondaries: secondary[] = [];
    public conditions: Condition[] = [];
    public before_actions: Action[] = [];
    public after_actions: Action[] = [];
    public actions: Action[] = [];
    public config: {[k: string]: {[k: string]: unknown} } = {};
    public log?: string;
    public test?: boolean;
    [k: string]: unknown;
    private parent: Schema;
    constructor(rule: Rule|xRule, parent: Schema) {
        this.parent = parent;
        this.name = rule.name;
        this.display = rule.display;
        this.enabled = rule.enabled;
        this.position = rule.position;
        this.primary = rule.primary;
        this.primaryKey = rule.primaryKey;
        for (const key of Object.keys(rule)) this[key] = rule[key];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public mutate(changes: {[k: string]: any}, save: boolean = true): Rule {
        if (changes.name && changes.name !== this.name){
            const rules = new Rules(this.parent.name);
            if (rules.find(changes.name)) throw new xError("Name taken.", "name", 409);
        }
        Object.keys(changes).forEach(key => {
            this[key as keyof Connector] = changes[key]
        }); if (save) { this.save(); } return this;
    }
    public save(): Rule {
        const rules = new Rules(this.parent.name);
        if (!rules.find(this.name)) this.parent.rules.push(this);
        this.parent.save();
        return this;
    }
    public toggle(): true {
        this.mutate({ enabled: !this.enabled });
        return true;
    }
    public destroy(): true {
        this.parent.mutate({ rules: this.parent.rules.filter(c=>c.name!==this.name) });
        return true;
    }
    public parse(): xRule {
        return parse(this, (k, v) => {
            if(k == 'parent') return undefined;
            return v;
        });
    }
}

export class Rules {
    schema: Schema;
    constructor(schema_name: string) {
        this.schema = schemas.get(schema_name);
    }
    public create(rule: Rule|xRule, save: boolean = true, oldName?: string): Rule {
        if (!oldName) {
            if (this.find(rule.name)) throw new xError("Name taken.", "name", 409);
        }
        const temp = new Rule(rule, this.schema);
        if (!save) return temp;
        if (oldName) {
            this.get(oldName).mutate(rule);
        } else {
            temp.save();
        }
        
        return temp;
    }
    public mutate(rule: Rule|xRule, save: boolean = true, oldName: string): Rule {
        return this.create(rule, save, oldName );
    }
    public reorder(from: number, to: number): true {
        const schema = this.schema;
        const copy = [...schema.rules];
        copy[to] = schema.rules[from];
        copy[from] = schema.rules[to];
        schema.rules = copy;
        return true;
    }
    public getAll(): Rule[] {
        return this.schema.rules;
    }
    public get(name: string): Rule {
        const rule = this.schema.rules.filter(c=>c.name===name)[0];
        if (!rule) throw new xError("Rule does not exist.", undefined, 404);
        return rule;
    }
    public find(name: string): Rule|undefined {
        return this.schema.rules.find(s=>s.name===name);
    }
    public parse(): xRule[] {
       return this.schema.parse().rules;
    }
}

interface xConnnector {
    id: string;
    name: string;
    [k: string]: unknown;
}
export class Connector {
    public id: string;
    public name: string;
    [k: string]: unknown;
    private parent: Schema;
    constructor(connnector: Connector|xConnnector, parent: Schema) {
        this.parent = parent;
        this.name = connnector.name;
        this.id = connnector.id;
        for (const key of Object.keys(connnector)) this[key] = connnector[key];
    }
    public save(): Connector {
        const connnectors = new Connectors(this.parent.name);
        if (!connnectors.find(this.name)) this.parent.connectors.push(this);
        this.parent.save();
        return this;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public mutate(changes: {[k: string]: any}, save: boolean = true): Connector {
        if (changes.name && changes.name !== this.name){
            const connnectors = new Connectors(this.parent.name);
            if (connnectors.find(changes.name)) throw new xError("Name taken.", "name", 409);
        }
        Object.keys(changes).forEach(key => {
            this[key as keyof Connector] = changes[key]
        }); if (save) { this.save(); } return this;
    }
    public destroy(): true {
        this.parent.mutate({ connectors: this.parent.connectors.filter(c=>c.name!==this.name) });
        return true;
    }
    public async validate(): Promise<true> {
        if (!providers[this.id]) throw new xError("Unknown provider.", undefined, 404);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const provider = new providers[this.id]({...this.parse(), schema: this.parent} as any);
        return await provider.validate();
    }
    public parse(): xConnnector {
        return parse(this, (k, v) => {
            if(k == 'parent') return undefined;
            return v;
        });
    }
}

export class ConnectorX extends Connector {
    declare schema: Schema;
    declare path: string;
}

export class Connectors {
    schema: Schema;
    constructor(schema_name: string) {
        this.schema = schemas.get(schema_name);
    }
    public async create(connector: Connector|xConnnector, force: boolean = false, save: boolean = true, oldName?: string): Promise<Connector> {
        if (connector.password && typeof connector.password === "string") {
            const hash = await encrypt(connector.password as string);
            connector.password = hash;
        }
        if (!oldName) {
            if (this.find(connector.name)) throw new xError("Name taken.", "name", 409);
        }
        const temp = new Connector(connector, this.schema);
        try { await temp.validate(); }
        catch (e) { if (!force) throw new xError(e);  }
        if (!save) return temp;
        if (oldName) {
            this.get(oldName).mutate(connector);
        } else {
            temp.save();
        }
        return temp;
    }
    public async mutate(connector: Connector|xConnnector, force: boolean = false, save: boolean = true, oldName: string): Promise<Connector> {
        return this.create(connector, force, save, oldName );
    }
    public reorder(from: number, to: number): true {
        const schema = this.schema;
        const copy = [...schema.connectors];
        copy[to] = schema.connectors[from];
        copy[from] = schema.connectors[to];
        schema.connectors = copy;
        return true;
    }
    public getAll(): Connector[] {
        return this.schema.connectors;
    }
    public get(name: string): Connector {
        const connector = this.schema.connectors.filter(c=>c.name===name)[0];
        if (!connector) throw new xError("Connector does not exist.", undefined, 404);
        return connector;
    }
    public find(name: string): Connector|undefined {
        return this.schema.connectors.find(s=>s.name===name);
    }
    public parse(): xConnnector[] {
       return this.schema.parse().connectors;
    }
}

interface xSchema {
    name: string;
    version: string;
    connectors: Connector[];
    rules: Rule[];
    [k: string]: unknown;
}
export class Schema {
    public name: string;
    public version: string;
    public connectors: Connector[] = [];
    public rules: Rule[] = [];
    private parent: Schemas;
    constructor(schema: Schema|xSchema, parent: Schemas) {
        this.parent = parent;
        this.name = schema.name;
        this.version = schema.version;
        for (const connnector of schema.connectors||[]) this.connectors.push(new Connector(connnector, this) );
        for (const rule of schema.rules||[]) this.rules.push(new Rule(rule, this) );
    }
    public save(write: boolean = true): Schema {
        const clean = {
            name: this.name,
            version: this.version,
            connectors: this.connectors.map(c=>c.parse?c.parse():c),
            rules: this.rules.map(c=>c.parse?c.parse():c),
        };
        if (write) fs.writeFileSync(`${paths.schemas}/${this.name}.yaml`, stringify(clean));
        if (this.parent.find(this.name)) {
            this.parent.array = this.parent.array.map(schema=>schema.name===this.name?this:schema);
        } else { this.parent.array.push(this); }
        return this;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public mutate(changes: {[k: string]: any}, save: boolean = true): Schema {
        if (changes.name && changes.name !== this.name){
            if (this.parent.find(changes.name)) throw new xError("Name taken.", "name", 409);
            this.destroy();
        }
        Object.keys(changes).forEach(key => {
            this[key as keyof Schema] = changes[key]
        }); if (save) { this.save(); } return this;
    }
    public destroy(): true {
        fs.unlinkSync(`${paths.schemas}/${this.name}.yaml`);
        this.parent.array = this.parent.array.filter(schema=>schema.name!=this.name);
        return true;
    }
    public async headers():  Promise<{ headers: { [connector: string]: string[] }, errors: { [connector: string]: string } }> {
        const headers: { [connector: string]: string[] } = {};
        const errors: { [connector: string]: string } = {};
        for (const connector of this.connectors||[]) {
            if (!providers[connector.id]) continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const provider = new providers[connector.id]({...connector.parse(), schema: this} as any);
            try { headers[connector.name] = await provider.getHeaders(); } catch (e) { errors[connector.name] = (e as xError).message; }
        } return {headers, errors};
    }
    public parse(): xSchema {
        return parse(this, (k, v) => {
            if(k == 'parent') return undefined;
            if(k == 'connectors') return parse(v);
            if(k == 'rules') return parse(v);
            return v;
        });
    }
}
export class Schemas {
    public array: Schema[] = [];
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
        if (this.find(schema.name)) throw new xError("Name taken.", "name", 409);
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
    public find(name: string): Schema|undefined {
        return this.array.find(s=>s.name===name);
    }
    public get(name: string, parse?: false): Schema;
    public get(name: string, parse?: true): xSchema;
    public get(name: string, parse: boolean = false): Schema|xSchema {
        const schema = this.find(name);
        if (!schema) throw new xError("Schema not found.", undefined, 404);
        return parse ? schema.parse() : schema;
    }
}

