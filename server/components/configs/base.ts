import { xError } from "../../modules/common";
import { decrypt } from "../../modules/cryptography";
import { compile } from "../../modules/handlebars";

export interface configs {[name: string]: base_config  }

export class base_config {
    private id: string;
    private options: Partial<base_config>;
    private name?: string;
    public dataKeys: string[] = [];
    public compiledDataKeys: string[] = [];
    private schema: Schema;
    [k: string]: unknown;
    constructor(schema: Schema, options: Partial<base_config>, configName?: string) {
        this.schema = schema;
        const { name, ...extraConfig} = options;
        this.id = name as string;
        this.options = options;
        if (configName) {
            this.name = configName;
            const preConfig = this.schema.actions.find(c=>c.name===configName);
            if (!preConfig) throw new xError(`Config '${configName}' does not exist.`);
            const { id, name, ...config } = preConfig;
            for (const key of Object.keys(config)) if (config[key]) this[key] = config[key];
        }
        for (const key of Object.keys(extraConfig)) if (extraConfig[key]) this[key] = extraConfig[key];
    }
    private async decrypt() {
        if (this.password && typeof this.password !== 'string') this.password = await decrypt(this.password as Hash);
    }
    public async initialize(configs: configs): Promise<void> {
        await this.decrypt();
        if (this.name) configs[this.name] = this;
    }
    public writeData(data: rString<any>, template: template): void {
        for (const key of this.dataKeys) data[key] = this[key] as string;
        for (const key of this.compiledDataKeys) data[key] = compile(template, this[key] as string);
    }
}
