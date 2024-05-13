import { xError } from "../../modules/common.js";
import { base_provider, base_provider_options } from "./base.js";
import { Hash, decrypt } from "../../modules/cryptography.js";
import nodemailer from "nodemailer";

export interface email_options extends base_provider_options {
    host: string;
    type: string;
    username: string;
    password: string|Hash;
    from: string;
    port?: string;
    html?: boolean;
}

export default class EMAIL extends base_provider {
    private type: string;
    private host: string;
    private from: string;
    private port: number = 25;
    private username: string;
    public password: string|Hash;
    public html: boolean = false;
    constructor(options: email_options) {
        super(options);
        this.type = options.type;
        this.host = options.host;
        if (options.port) this.port = Number(options.port);
        this.username = options.username;
        this.password = options.password;
        this.from = options.from;
        this.html = options.html||false;
    }
    async validate(): Promise<true> {
        if (!this.type) throw new xError('Type can not be empty.', 'type');
        if (!this.host) throw new xError('Host can not be empty.', 'host');
        if (!this.username) throw new xError('Username can not be empty.', 'username');
        if (!this.password) throw new xError('Password can not be empty.', 'password');
        if (!this.from) throw new xError('From can not be empty.', 'from');
        if (!this.from) throw new xError('From can not be empty.', 'from');
        if (typeof this.password === 'object'){
            if (!(this.password as Hash).encrypted) throw new xError('Password malformed.', 'password');
            if (!(this.password as Hash).iv) throw new xError('Password malformed.', 'password');
        } return true;
    }
    public async configure(): Promise<nodemailer.Transporter> {
        const pass = await decrypt(this.password as Hash);
        const client = nodemailer.createTransport({
            host: this.host||'',
            port: this.port,
            auth: {
              user: this.username,
              pass,
            },
        });
        return client;
    }
}