import { hasLength, isAlphanumeric, isNotEmpty, validate } from "../../modules/common";
import { base_provider, base_provider_options } from "./base";
import ldap from "../../modules/ldap";

export interface ldap_options extends base_provider_options {
    url: string;
    username: string;
    password: string|Hash;
    dse?: string;
    ou?: string;
    filter?: string;
    target?: string;
}

export default class LDAP extends base_provider {
    private client = new ldap();
    private url: string;
    private username: string;
    private password: string|Hash;
    private dse?: string;
    private ou?: string;
    private filter?: string;
    private target?: string;
    constructor(options: ldap_options) {
        super(options);
        for (const key of Object.keys(options)) this[key] = options[key];
        this.url = options.url;
        this.username = options.username;
        this.password = options.password;
    }
    public async validate() {
       validate( this, {
           name: isAlphanumeric('Name can only contain alphanumeric characters.'),
           url: hasLength({ min: 4 }, 'Path must be at least 4 characters long.'),
           username: isNotEmpty('Username can not be empty.'),
           password: isNotEmpty('Password can not be empty.'),
       });
       const client1 = new ldap();
       await client1.connect(this.url);
       await client1.login(this.username, this.password as string);
    }
    public async initialize() {
        await this.decrypt();
        if (this.filter) this.client.filter = this.filter;
    }
    public async configure() {
        await this.client.connect(this.url);
        await this.client.login(this.username, this.password as string);
        this.client.base = this.dse || await this.client.getRoot();
    }
    public async getHeaders(): Promise<string[]> {
        if (!this.target) return await this.client.getAttributes();
        const entry = await this.client.searchOne({ scope: 'sub' }, this.target);
        return entry.attributes.map(a=>a.type);
    }
   //public async connect(): Promise<{ [k: string]: string }[]> {
   //    const { data: rows } = await this.open() as { data: {[k: string]: string}[] };
   //    this.data = rows;
   //    return rows;
   //}
}
