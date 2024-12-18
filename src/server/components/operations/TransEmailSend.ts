import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import SMTPConnection from "nodemailer/lib/smtp-connection";
import { xError } from "../../modules/common.js";
import { props } from "../operations.js";
import { Settings } from "../database.js";
import { compile } from "../../modules/handlebars.js";
import { decrypt } from "../../modules/cryptography.js";
import Operation from "../operation.js";

export default class TransEmailSend extends Operation {
    to!: string;
    subject!: string;
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    from?: string;
    text?: string;
    html?: string;
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        super.execute({ action, template, execute, data, ...rest });
        try {
            data.host = compile(template, action.host);
            data.port = compile(template, action.port||"25");
            data.username = compile(template, action.username);
            data.to = compile(template, action.to);
            data.from = compile(template, action.from);
            data.subject = compile(template, action.subject);
            if (action.text) data.text = compile(template, action.text);
            if (action.html) data.html = compile(template, action.html);
            if (action.password && typeof action.password !== 'string') data.password = await decrypt(action.password as Hash);
            if (action.auth==="basic") data.password = Buffer.from(data.password as string).toString('base64');
            const client =  await this.buildClient(data);
            if (!client) throw new xError("Client not connected.")
            if (!execute) return { data };
            await client.sendMail({
                from: data.from as string,
                to: data.to as string,
                subject: data.subject as string,
                text: data.text ? data.text as string : undefined,
                html: data.html ? data.html as string : undefined,
            });
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
    private async buildClient(data: rString<TransEmailSend>): Promise<nodemailer.Transporter<SMTPTransport.SentMessageInfo>> {
        let url: URL|undefined;
        const settings = await Settings();
        if (settings.proxy_url) {
            url = new URL(settings.proxy_url);
            if (settings.proxy_username) url.username = settings.proxy_username;
            if (settings.proxy_password) url.password = settings.proxy_password as string;
        }
        return nodemailer.createTransport({
            host: data.host,
            port: Number(data.port),
            proxy: url,
            auth: {
              user: data.username,
              pass: data.password,
            },
        } as SMTPConnection.Options);
    }
}