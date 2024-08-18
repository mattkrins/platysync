import SMTPConnection from "nodemailer/lib/smtp-connection/index.js";
import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props, useConfig } from "../actions.js";
import nodemailer from "nodemailer";
import { Settings } from "../database.js";

interface TransEmailSend {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    from?: string;
    config?: string;
}

export default async function TransEmailSend({ action, template, execute, data, configs, schema }: props<TransEmailSend>) {
    try {
        if (action.config){
            data.config = String(action.config);
            const config = await useConfig(configs, action.config, schema);
            data.host = config.host as string;
            data.port = config.port as string;
            data.username = config.username as string;
            data.password = config.password as string;
            data.from = config.from as string;
        } else {
            data.host = action.host;
            data.port = action.port;
            data.username = action.username;
            data.password = action.password;
            data.from = compile(template, action.from);
        }
        data.to = compile(template, action.to);
        data.subject = compile(template, action.subject);
        if (action.text) data.text = compile(template, action.text);
        if (action.html) data.html = compile(template, action.html);
        if (!execute) return { data };
        let proxy: URL|undefined;
        const settings = await Settings();
        if (settings.proxy_url) {
            const url = new URL(settings.proxy_url);
            if (settings.proxy_username) url.username = settings.proxy_username;
            if (settings.proxy_password) url.password = settings.proxy_password as string;
            proxy = url;
        }
        const client = nodemailer.createTransport({
            host: data.host,
            port: data.port,
            proxy: proxy,
            auth: {
              user: data.username,
              pass: data.password,
            },
        } as SMTPConnection.Options);
        await client.sendMail({
            from: data.from,
            to: data.to,
            subject: data.subject,
            text: data.text,
            html: data.html,
        });
        
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
