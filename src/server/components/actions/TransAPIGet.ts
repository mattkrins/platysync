import { xError } from "../../modules/common.js";
import { props } from "../actions.js";
import API from "../configs/API.js";

interface api {
    endpoint: string;
    auth: string;
    password?: string;
    append?: string;
}

interface TransAPIGet extends api {
    target: string;
    method: string;
    mime: string;
    data: string;
    form: FormDataValue[];
    responsePath: string;
    path: string;
}

export default async function TransAPIGet({ action, template, execute, data, configs, schema }: props<TransAPIGet>) {
    try {
        let api = action.config ? configs[action.config] as API : undefined;
        if (!api){
            api = new API(schema, action, action.config);
            await api.initialize(configs);
        }
        api.writeData(data, template);
        if (!execute) return { data };

        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
