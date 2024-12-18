import { hasLength, isAlphanumeric, isNotEmpty, validate, xError } from "../../modules/common.js";
import { base_provider, base_provider_options } from "./base.js";
import ldap, { User } from "../../modules/ldap.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../operations.js";

export interface LdapProps {
    connector: string;
    userFilter?: string;
  }

export interface ldap_context {
    userFilter?: string;
}

export interface ldap_options extends base_provider_options, ldap_context {
    url: string;
    username: string;
    password: string|Hash;
    dse?: string;
    ou?: string;
    filter?: string;
    target?: string;
}

export default class LDAP extends base_provider {
    public client = new ldap();
    private url: string;
    private username: string;
    private password: string|Hash;
    private dse?: string;
    private ou?: string;
    private filter?: string;
    private target?: string;
    private userFilter?: string;
    public users: {[id: string]: User} = {};
    constructor(options: ldap_options) {
        super(options);
        for (const key of Object.keys(options)) this[key] = options[key];
        this.url = options.url;
        this.username = options.username;
        this.password = options.password;
        this.userFilter = options.userFilter;
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
        if (this.ou) this.client.base = `${this.ou},${this.client.base}`
    }
    public async getHeaders(): Promise<string[]> {
        if (!this.target) throw new xError("Specify a target to autodetect headers.", null, 400);
        const { entry } = await this.client.searchOne({ scope: 'sub' }, this.target);
        return entry.attributes.map(a=>a.type);
    }
    public async connect(): Promise<{ [k: string]: string }[]> {
        const { users, keyedUsers } = await this.client.search(this.headers, this.key);
        this.data = users;
        this.users = keyedUsers;
        return users;
    }
    public async getUser(template: template, id?: string, userFilter?: string, compiledFilter?: string): Promise<User|false> {
        if (id && this.users[id]) return this.users[id];
        try {
            const filter = compiledFilter || compile(template, userFilter || this.userFilter, `(&(objectclass=person)(sAMAccountName=${id}))`);
            const { user } = await this.client.searchOne({
                filter,
                scope: 'sub',
                sizeLimit: 1000,
                paged: true,
                attributes: this.headers
            });
            if (!user) return false;
            if (id) this.users[id] = user;
            return user;
        } catch { return false; }
    }
    static async getUser({ action, template, data, connections, id }: props<LdapProps>, canBeFalse = false): Promise<User> {
        data.connector = String(action.connector);
        if (!action.userFilter && !id) throw new xError("Search filter required.");
        data.userFilter = compile(template, action.userFilter, `(&(objectclass=person)(sAMAccountName=${id}))`);
        if (!data.connector) throw new xError("Connector not provided.");
        const ldap = connections[data.connector] as LDAP|undefined;
        if (!ldap || !ldap.client) throw new xError(`Provider '${data.connector}' not connected.`);
        const user = await ldap.getUser(template, id, undefined, data.userFilter );
        if (!canBeFalse && !user) throw new xError("User not found.");
        return user as User;
      }
}
