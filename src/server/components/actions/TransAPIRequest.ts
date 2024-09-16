import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../actions.js";
import API from "../configs/API.js";
import fs from 'fs-extra';
import FormData from 'form-data';
import { AxiosHeaderValue } from "axios";
import { getNestedValue } from "../providers/API.js";

interface api {
    endpoint: string;
    auth: string;
    password?: string;
    append?: string;
}

interface TransAPIRequest extends api {
    target: string;
    method: string;
    mime: string;
    data: string;
    key: string;
    form: FormDataValue[];
    responsePath: string;
    path: string;
    evaluation: boolean;
}

const ContentTypes: { [k: string]: string } = {
    text: "text/plain",
    form: "multipart/form-data",
    xml: "application/xml",
    json: "application/json",
}

export default async function TransAPIRequest({ action, template, execute, data, configs, schema }: props<TransAPIRequest>) {
    try {
        let api = action.config ? configs[action.config] as API : undefined;
        if (!api){
            api = new API(schema, action, action.config);
            await api.initialize(configs);
        }
        api.writeData(data, template);
        if (!api.client) throw new xError("Client not connected.");
        if (!execute && !action.evaluation) return { data };
        let form: FormData|undefined;
        if (action.mime==='form') {
            form = new FormData();
            const formdata: TransAPIRequest['form'] = [];
            for (const entry of (action.form||[])) {
                const key = compile(template, entry.key);
                const value = compile(template, entry.value);
                formdata.push({ type: entry.type, key, value });
                if (entry.type==="string") form.append(key, value);
                if (entry.type==="file"){
                    const fileStream = fs.createReadStream(value);
                    form.append(key, fileStream as unknown as Blob);
                }
            }
        }
        const formHeaders = form ? form.getHeaders() : {};
        const contentHeaders: {[k: string]: AxiosHeaderValue} = { 'Content-Type': ContentTypes[data.mime] };
        const body = !data.data ? undefined : action.mime==='json' ? JSON.parse(data.data) : action.mime==='form' ? form : data.data;
        const response = await api.client.request({
            url: `${data.endpoint}${data.target}`,
            method: data.method||"get",
            headers: { ...formHeaders, ...contentHeaders },
            data: body,
        })
        if (data.key){
            let responseData = response.data;
            if (data.responsePath) responseData = getNestedValue(response.data, data.responsePath);
            template[data.key] = JSON.stringify(responseData) as unknown as {[header: string]: string};
        }
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
