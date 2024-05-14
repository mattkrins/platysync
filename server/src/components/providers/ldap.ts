import { xError } from "../../modules/common.js";
import { base_provider, base_provider_options } from "./base.js";
import { Hash, decrypt } from "../../modules/cryptography.js";
import ldap from "../../modules/ldap.js";

export interface ldap_inline {
    filter?: string;
}

export interface ldap_options extends base_provider_options, ldap_inline {
    url: string;
    username: string;
    password: string|Hash;
    attributes: string[];
    dse?: string;
    base?: string;
}

export default class LDAP extends base_provider {
    private mustHave = ['sAMAccountName', 'userPrincipalName', 'cn', 'uid', 'distinguishedName', 'userAccountControl', 'memberOf'];
    public attributes: string[] = this.mustHave;
    private url: string;
    private username: string;
    public password: string|Hash;
    private filter?: string;
    private dse?: string;
    private base?: string;
    constructor(options: ldap_options) {
        super(options);
        this.url = options.url;
        this.username = options.username;
        this.password = options.password;
        this.attributes = options.attributes;
        this.filter = options.filter;
        this.dse = options.dse;
        this.base = options.base;
    }
    async validate(): Promise<true> {
        if (!this.url) throw new xError('URL can not be empty.', 'url');
        if (!this.username) throw new xError('Username can not be empty.', 'username');
        if (!this.password) throw new xError('Password can not be empty.', 'password');
        if (!this.attributes || this.attributes.length <= 0) throw new xError('Attributes can not be empty.');
        if (typeof this.password === 'object'){
            if (!(this.password as Hash).encrypted) throw new xError('Password malformed.', 'password');
            if (!(this.password as Hash).iv) throw new xError('Password malformed.', 'password');
        }
        await this.configure();
        return true;
    }
    public async configure(): Promise<ldap> {
        const client = new ldap();
        if (this.filter) client.filter = this.filter;
        await client.connect(this.url);
        const password = await decrypt(this.password as Hash);
        await client.login(this.username, password);
        let base: string = this.dse || await client.getRoot();
        if (!base || base.trim()==='') throw new xError("Root DSE is empty.");
        if ((this.base||'')!=='') base = `${this.base},${base}`;
        client.base = base;
        this.getAttributes();
        return client;
    }
    public async getHeaders(): Promise<string[]> {
        return this.getAttributes();
    }
    private getAttributes(): string[] {
        this.attributes = this.attributes||[];
        for (const a of this.mustHave) if (!this.attributes.includes(a)) this.attributes.push(a);
        this.attributes = this.attributes.filter((b, index, self) => index === self.findIndex((a) => ( a === b )) );
        return this.attributes;
    }
}