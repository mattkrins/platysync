import { xError } from "../../modules/common.js";
import { base_provider, base_provider_options } from "./base.js";
import { Hash, decrypt } from "../../modules/cryptography.js";
import { ConnectorX, Connectors, Schema } from "../models.js";
import eduSTAR from "../../modules/eduSTAR.js";
import PROXY from "./proxy.js";
import CSV from "./csv.js";

export interface stmc_inline {
    match?: string;
    inactive?: boolean;
}

export interface stmc_options extends base_provider_options, stmc_inline {
    username: string;
    password: string|Hash;
    school: string;
    schema: Schema;
    proxy?: string;
    cache?: string;
}

export default class STMC extends base_provider {
    private schema: Schema;
    private school: string;
    private username: string;
    public password: string|Hash;
    private proxy?: string|PROXY;
    private cache?: number = 1440;
    private match?: string;
    private inactive?: boolean = false;
    constructor(options: stmc_options) {
        super(options);
        this.username = options.username;
        this.password = options.password;
        this.school = options.school;
        this.schema = options.schema;
        this.proxy = options.proxy;
        this.cache = Number(options.cache||"1440");
        this.match = options.match;
        this.inactive = options.inactive;
    }
    public async validate(): Promise<true> {
        if (!this.schema) throw new xError('Schema can not be empty.', 'schema');
        if (!this.school) throw new xError('School can not be empty.', 'school');
        if (!this.username) throw new xError('Username can not be empty.', 'username');
        if (!this.password) throw new xError('Password can not be empty.', 'password');
        await this.configure();
        return true;
    }
    public async configure(): Promise<eduSTAR> {
        if (this.proxy && String(this.proxy).trim()!==""){
            this.proxy = new PROXY({ schema: this.schema, name: this.proxy as string, id: '' })
            await this.proxy.configure();
        }
        const eduhub = this.match ? (await this.eduhub(this.match)).data : undefined;
        const client = new eduSTAR({
            school: this.school,
            proxy: this.proxy ? (this.proxy as PROXY).url : undefined,
            inactive: this.inactive,
            cache: this.cache,
            eduhub
        });
        const password = await decrypt(this.password as Hash);
        await client.login(this.username, password);
        return client;
    }
    public async getHeaders(): Promise<string[]> {
        return ['_class', '_cn', '_desc', '_disabled', '_displayName', '_dn', '_firstName',
        '_google', '_intune', '_lastLogon', '_lastName', '_lastPwdResetViaMC', '_lockedOut',
        '_login', '_o365', '_pwdExpired', '_pwdExpires', '_pwdLastSet',
        '_pwdNeverExpires', '_pwdResetAction', '_pwdResetTech', '_yammer', '_eduhub' ];
    }
    private async eduhub(name: string): Promise<{ data: {[k: string]: string}[] }> {
        const connectors = new Connectors(this.schema.name);
        const connector = connectors.get(name) as ConnectorX;
        const csv = new CSV(connector);
        return await csv.open() as { data: {[k: string]: string}[] };
    }
}