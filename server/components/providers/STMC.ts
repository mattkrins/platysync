import { isNotEmpty, validate, xError } from "../../modules/common";
import eduSTAR from "../../modules/eduSTAR";
import { compile } from "../../modules/handlebars";
import { Settings } from "../database";
import { Engine } from "../engine";
import { connect, connections } from "../providers";
import { base_provider, base_provider_options } from "./base";
import CSV from "./CSV";

export interface stmc_options extends base_provider_options {
    username: string;
    password: string|Hash;
    school: string;
    cache?: string;
    eduhub?: string;
    includeInactive?: boolean;
}

export default class STMC extends base_provider {
    private username: string;
    private password: string|Hash;
    private school: string;
    private cache?: number = 1440;
    private eduhub?: string;
    private includeInactive: boolean = false;
    public client: eduSTAR;
    constructor(options: stmc_options) {
        super(options);
        this.username = options.username;
        this.password = options.password;
        this.school = options.school;
        this.eduhub = options.eduhub;
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
        await this.decrypt();
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
        const headers = ['_class', '_cn', '_desc', '_disabled', '_displayName', '_dn', '_firstName',
        '_google', '_intune', '_lastLogon', '_lastName', '_lastPwdResetViaMC', '_lockedOut',
        '_o365', '_pwdExpired', '_pwdExpires', '_pwdLastSet',
        '_pwdNeverExpires', '_pwdResetAction', '_pwdResetTech', '_yammer' ];
        return this.eduhub ? [ '_login', '_stkey', ...headers, '_score' ] : [ '_login', ...headers ];
    }
    public async connect(connectors: connections, engine: Engine): Promise<{ [k: string]: string }[]> {
        this.client.alert = (text: string) => engine.Emit({ text });
        const students = await this.client.getStudents();
        if (this.eduhub) {
            const eduhub = await connect(this.schema, this.eduhub, connectors, engine ) as CSV;
            const matched = await this.client.getStudentsMatchSTKEY(eduhub.data||[]);
            this.data = matched;
            return matched;
        }
        this.data = students;
        return students;
    }
}
