import { decrypt } from "../../modules/cryptography";

export interface base_provider_options extends Connector {
    id: string;
    name: string;
    schema: Schema;
    key?: string;
    [name: string]: unknown;
}

export class base_provider implements base_provider_options {
    id: string;
    name: string;
    schema: Schema;
    key?: string;
    data: {[k: string]: string}[] = [];
    headers:  string[] = [];
    [k: string]: unknown;
    constructor(options: base_provider_options) {
        this.id = options.id;
        this.name = options.name;
        this.schema = options.schema;
        this.key = options.key;
        this.headers = options.headers || [];
    }
    public async validate(): Promise<void> {}
    public async configure(): Promise<void> {}
    public async connect(): Promise<{ [k: string]: string }[]> { return []; }
    public async initialize(): Promise<void> {}
    public async getHeaders(): Promise<string[]> { return []; }
    public async decrypt() {
        if (this.password && typeof this.password !== 'string') this.password = await decrypt(this.password as Hash);
    }
}