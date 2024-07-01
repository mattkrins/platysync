export interface base_provider_options {
    id: string;
    name: string;
    [name: string]: unknown;
    schema: Schema;
}

export class base_provider implements base_provider_options {
    id: string;
    name: string;
    schema: Schema;
    [k: string]: unknown;
    constructor(options: base_provider_options) {
        this.id = options.id;
        this.name = options.name;
        this.schema = options.schema;
    }
    public async validate(): Promise<void> {}
    public async configure(): Promise<void> {}
    public async connect(): Promise<any> {}
    public async preConfigure(): Promise<void> {}
    public async getHeaders(): Promise<string[]> { return []; }
}