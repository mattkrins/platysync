import { AxiosError, AxiosHeaderValue } from "axios";
import { validStr, xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { Action, actionProps } from "../../typings/common.js";
import { Connectors } from "../models.js";
import API, { api_options } from "../providers/api.js";
import * as fs from 'fs';
import FormData from 'form-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolvePath(path: string | string[], obj: any, separator = '.') {
    const properties = Array.isArray(path) ? path : path.split(separator);
    return properties.reduce((prev, curr) => prev && prev[curr], obj);
}

interface props extends actionProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    action: Action & {
        target: string;
        source: string;
        method: string;
        mime: string;
        data?: string;
        response: string;
        path: string;
        form: { key: string, value: string, type: string }[];
    }
}

export default async function ({ action, template, execute, data, schema, connections }: props) {
    try {
        data.method = action.method;
        data.mime = 
        action.mime==='json' ? 'application/json' :
        action.mime==='xml' ? 'text/xml' :
        action.mime==='form' ? 'multipart/form-data' : 'text/plain';
        if (action.data) data.data = compile(template, action.data);
        if (!connections[action.source]) {
            const connectors = new Connectors(schema.name);
            const provider = connectors.get(action.source) as unknown as api_options;
            const api = new API({...provider, schema});
            if (!execute) await api.validate();
            connections[action.source] = { rows: [], keyed: {}, objects: {}, client: api }
        }
        const api = connections[action.source].client as API;
        data.endpoint = `${api.endpoint}${compile(template, action.target)}${api.append}`;
        if (!execute) return { data };
        const client = await api.configure();

        let form: FormData|undefined;
        if (action.mime==='form') {
            form = new FormData();
            const formdata: props['action']['form'] = [];
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
            data.formData = formdata;
        }

        const body = !data.data ? undefined : action.mime==='json' ? JSON.parse(data.data) : action.mime==='form' ? form : data.data;
        const headers: {[k: string]: AxiosHeaderValue} = { 'Content-Type': data.mime };
        const response = await client.request({
            url: `${compile(template, action.target)}${api.append}`,
            method: action.method,
            data: body,
            headers
        });
        if (validStr(action.response)){
            const str = validStr(action.path) ? String(resolvePath(action.path, response.data)) : JSON.stringify(response.data||"");
            template[action.response] = str;
            data[action.response] = str;
        }
        return { success: true, data };
    } catch (e){
        const axiosError = (e as AxiosError);
        if (axiosError.code) data.errorCode = String(axiosError.code);
        if (axiosError.message) data.errorMessage = String(axiosError.message);
        if (axiosError.response && axiosError.response.status) data.errorStatus = String(axiosError.response.status);
        if (axiosError.response && axiosError.response.data) data.error = JSON.stringify(axiosError.response.data);
        return { error: new xError(e), data };
    }
}
