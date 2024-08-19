import SMTPTransport from "nodemailer/lib/smtp-transport";
import { Settings } from "../database";
import { base_config, configs } from "./base";
import nodemailer from "nodemailer";
import SMTPConnection from "nodemailer/lib/smtp-connection";

export default class EMAIL extends base_config {
    private client?: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
    public dataKeys: string[] = ['host', 'port', 'username'];
    public compiledDataKeys: string[] = ['from', 'to', 'subject', 'text', 'html'];
    [k: string]: unknown;
    constructor(schema: Schema, options: Partial<base_config>, name?: string) {
        super(schema, options, name);
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
}
