import { xError } from "../../modules/common.js";
import { props } from "../actions.js";
import EMAIL from "../configs/EMAIL.js";

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

export default async function TransEmailSend({ action, template, execute, data, configs, schema, ...props }: props<TransEmailSend>) {
    try {
        let email = action.config ? configs[action.config] as EMAIL : undefined;
        if (!email){
            email = new EMAIL(schema, action, action.config);
            await email.initialize(configs);
        }
        email.writeData(data, template);
        console.log(email.host)
        if (!execute) return { data };

        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
