import { isNotEmpty, validate, xError } from "../../modules/common";
import eduSTAR from "../../modules/eduSTAR";
import { Settings } from "../database";
import { base_provider, base_provider_options } from "./base";

export interface stmc_options extends base_provider_options {
    username: string;
    password: string|Hash;
    school: string;
    cache?: string;
    includeInactive?: boolean;
}

export default class STMC extends base_provider {
    private username: string;
    private password: string|Hash;
    private school: string;
    private cache?: number = 1440;
    private client: eduSTAR;
    private includeInactive: boolean = false;
    constructor(options: stmc_options) {
        super(options);
        this.username = options.username;
        this.password = options.password;
        this.school = options.school;
        this.cache = Number(options.cache||"1440");
        this.client = new eduSTAR({
           school: this.school,
           cache: this.cache,
           includeInactive: this.includeInactive,
        });
    }
    public async validate() {
        validate( this, {
            username: isNotEmpty('Username can not be empty.'),
            password: isNotEmpty('Password can not be empty.'),
            school: isNotEmpty('School can not be empty.'),
        });
        await this.client.validate();
        try {
            await this.client.login(this.username, this.password as string);
        } catch (e) {
            throw new xError(e, "username");
        }
    }
    public async initialize() {
        const settings = await Settings();
        if (settings.proxy_url) {
            const url = new URL(settings.proxy_url);
            if (settings.proxy_username) url.username = settings.proxy_username;
            if (settings.proxy_password) url.password = settings.proxy_password as string;
            this.client = new eduSTAR({
                school: this.school,
                cache: this.cache,
                includeInactive: this.includeInactive,
                proxy: url
             });
        }
    }
    public async configure(): Promise<void> {
        await this.client.login(this.username, this.password as string);
    }
    public async getHeaders(): Promise<string[]> {
        return ['_class', '_cn', '_desc', '_disabled', '_displayName', '_dn', '_firstName',
        '_google', '_intune', '_lastLogon', '_lastName', '_lastPwdResetViaMC', '_lockedOut',
        '_login', '_o365', '_pwdExpired', '_pwdExpires', '_pwdLastSet',
        '_pwdNeverExpires', '_pwdResetAction', '_pwdResetTech', '_yammer', '_eduhub' ];
    }
    public async connect(): Promise<{ [k: string]: string }[]> {
        return []
    }
}
