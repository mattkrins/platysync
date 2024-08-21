import { xError } from "../../modules/common.js";
import { props } from "../actions.js";
import EMAIL from "../configs/EMAIL.js";

interface api {
    endpoint: string;
    auth: string;
    password?: string;
    append?: string;
}

interface TransAPIGet extends api {
    target: string;

}

export default async function TransAPIGet({ action, template, execute, data, configs, schema }: props<TransAPIGet>) {
    try {
        let email = action.config ? configs[action.config] as EMAIL : undefined;
        if (!email){
            email = new EMAIL(schema, action, action.config);
            await email.initialize(configs);
        }
        email.writeData(data, template);
        if (!execute) return { data };

        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
