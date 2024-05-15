import { validStr, xError } from "../../modules/common.js";
import { base_provider, base_provider_options } from "./base.js";
import { Hash, decrypt } from "../../modules/cryptography.js";
import nodemailer from "nodemailer";
import PROXY from "./proxy.js";
import { Schema } from "../models.js";
import SMTPConnection from "nodemailer/lib/smtp-connection/index.js";

export interface email_options extends base_provider_options {
    host: string;
    type: string;
    username: string;
    password: string|Hash;
    from: string;
    port?: string;
    html?: boolean;
    proxy?: string;
    schema: Schema;
}

export default class EMAIL extends base_provider {
    private schema: Schema;
    private type: string = "smtp";
    private host: string;
    private from: string;
    private port: number = 25;
    private username: string;
    public password: string|Hash;
    public html: boolean = false;
    public client?: nodemailer.Transporter;
    private proxy?: string|PROXY;
    constructor(options: email_options) {
        super(options);
        this.type = options.type||"smtp";
        this.host = options.host;
        if (options.port) this.port = Number(options.port);
        this.username = options.username;
        this.password = options.password;
        this.from = options.from||this.username;
        this.html = options.html||false;
        this.proxy = options.proxy;
        this.schema = options.schema;
    }
    async validate(): Promise<true> {
        if (!this.schema) throw new xError('Schema can not be empty.', 'schema');
        if (!this.type) throw new xError('Type can not be empty.', 'type');
        if (!this.host) throw new xError('Host can not be empty.', 'host');
        if (!this.username) throw new xError('Username can not be empty.', 'username');
        if (!this.password) throw new xError('Password can not be empty.', 'password');
        if (!this.from) throw new xError('From can not be empty.', 'from');
        if (typeof this.password === 'object'){
            if (!(this.password as Hash).encrypted) throw new xError('Password malformed.', 'password');
            if (!(this.password as Hash).iv) throw new xError('Password malformed.', 'password');
        } return true;
    }
    public async configure(): Promise<nodemailer.Transporter> {
        if (validStr(this.proxy)){
            this.proxy = new PROXY({ schema: this.schema, name: this.proxy as string, id: '' })
            await this.proxy.configure();
        }
        const pass = await decrypt(this.password as Hash);
        const client = nodemailer.createTransport({
            host: this.host||'',
            port: this.port,
            proxy: this.proxy ? (this.proxy as PROXY).url : undefined,
            auth: {
              user: this.username,
              pass,
            },
        } as SMTPConnection.Options);
        this.client = client;
        return client;
    }
    public async send(to: string, subject: string, text: string, html: string,) {
        if (!this.client) return;
        return await this.client.sendMail({
            from: this.from,
            to,
            subject,
            text,
            html,
        });
    }
}