import { xError } from "../../modules/common";
import { decrypt } from "../../modules/cryptography";

export interface configs {[name: string]: base_config  }

export class base_config {
    id?: string;
    name?: string;
    schema: Schema;
    config?: ActionConfig;
    [k: string]: unknown;
    constructor(schema: Schema, name?: string) {
        this.schema = schema;
        if (!name) return;
        this.name = name;
        this.config = this.schema.actions.find(c=>c.name===name);
        if (!this.config) return;
        if (this.config.id) this.id = this.config.id;
    }
    public async initialize(configs: configs, name: string): Promise<base_config> {
        if (configs[name]) return configs[name];
        const config = this.schema.actions.find(c=>c.name===name);
        if (!config) throw new xError(`Config '${name}' does not exist.`);
        await this.decrypt();
        await this.configure();
        configs[name] = this;
        return this;
    }
    public async validate(): Promise<void> {}
    public async configure(): Promise<void> {}
    public async decrypt() {
        if (this.password && typeof this.password !== 'string') this.password = await decrypt(this.password as Hash);
    }
}