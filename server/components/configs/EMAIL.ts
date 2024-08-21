import SMTPTransport from "nodemailer/lib/smtp-transport";
import { Settings } from "../database";
import { base_config, configs } from "./base";
import nodemailer from "nodemailer";
import SMTPConnection from "nodemailer/lib/smtp-connection";
import { xError } from "../../modules/common";

export default class EMAIL extends base_config {
    public dataKeys: string[] = ['host', 'port', 'username'];
    public compiledDataKeys: string[] = ['from', 'to', 'subject', 'text', 'html'];
    private client?: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
    [k: string]: unknown;
    constructor(schema: Schema, options: Partial<base_config>, name?: string) {
        super(schema, options, name);
        if (!this.port) this.port = 25;
        if (!this.from) this.from = this.username;
        if (!this.text) this.text = undefined;
        if (!this.html) this.html = undefined;
    }
    public async initialize(configs: configs): Promise<void> {
        await super.initialize(configs);
        let proxy: URL|undefined;
        const settings = await Settings();
        if (settings.proxy_url) {
            const url = new URL(settings.proxy_url);
            if (settings.proxy_username) url.username = settings.proxy_username;
            if (settings.proxy_password) url.password = settings.proxy_password as string;
            proxy = url;
        }
        this.client = nodemailer.createTransport({
            host: this.host,
            port: Number(this.port),
            proxy: proxy,
            auth: {
              user: this.username,
              pass: this.password,
            },
        } as SMTPConnection.Options);
    }
    public async send(): Promise<void> {
        if (!this.client) throw new xError("Client not connected.")
        await this.client.sendMail({
            from: this.from as string,
            to: this.to as string,
            subject: this.subject as string,
            text: this.text ? this.text as string : undefined,
            html: this.html ? this.html as string : undefined,
        });
    }
}
