import SMTPTransport from "nodemailer/lib/smtp-transport";
import { Settings } from "../database";
import { base_config } from "./base";
import nodemailer from "nodemailer";
import SMTPConnection from "nodemailer/lib/smtp-connection";

export interface email_options {
    host: string;
    port: string;
    username: string;
    password: string;
}

export default class EMAIL extends base_config {
    private host: string;
    private port: string;
    private username: string;
    private password: string;
    private client?: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
    constructor(schema: Schema, options: email_options, name?: string) {
        super(schema, name);
        this.host = options.host;
        this.port = options.port;
        this.username = options.username;
        this.password = options.password;
        if (!this.config) return;
        if (this.config.host) this.host = this.config.host as string;
        if (this.config.port) this.port = this.config.port as string;
        if (this.config.username) this.username = this.config.username as string;
        if (this.config.password) this.password = this.config.password as string;

    }
    public async configure(): Promise<void> {
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