import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../actions.js";
import API from "../configs/API.js";
import fs from 'fs-extra';
import FormData from 'form-data';
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
    headers: FormDataValue[];
    responsePath: string;
    path: string;
    response: string;
    evaluation: boolean;
}

const ContentTypes: { [k: string]: string } = {
    text: "text/plain",
    form: "multipart/form-data",
    xml: "application/xml",
    json: "application/json",
    file: "application/octet-stream",
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
        let headers: {[k: string]: string} = {};
        let body;
        if (action.mime==='form') {
            form = new FormData();
            for (const entry of (action.form||[])) {
                const key = compile(template, entry.key);
                const value = compile(template, entry.value);
                if (entry.type==="string") form.append(key, value);
                if (entry.type==="file"){
                    const fileStream = fs.createReadStream(value);
                    form.append(key, fileStream as unknown as Blob);
                }
            }
            headers = form.getHeaders();
            body = form;
        }
        if (data.data && data.method) {
            body = data.data;
            if (!action.mime) body = JSON.parse(data.data);
            if (action.mime==='file') body = fs.createReadStream(data.data);
        }
        if (!headers['Content-Type']) headers['Content-Type'] = (ContentTypes[action.mime] || ContentTypes['json']);
        const compHeaders = [];
        for (const entry of (action.headers||[])) {
            const key = compile(template, entry.key);
            const value = compile(template, entry.value);
            headers[key] = value;
            compHeaders.push({key, value});
        }
        data.headers = compHeaders as unknown as string;
        const response = await api.client.request({
            url: `${data.endpoint}${data.target}`,
            method: data.method||"get",
            headers,
            data: body,
        })
        if (response.data) data.response = JSON.stringify(response.data);
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
