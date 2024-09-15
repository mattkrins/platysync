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
        if (!api.client) throw new xError("Client not connected.");
        if (!execute) return { data };
        const response = await api.client.request({
            url: `${data.endpoint}${data.target}`,
            method: data.method||"get",
            //data: !api.sendData ? undefined : JSON.parse(data.sendData||"{}")
        })

        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
