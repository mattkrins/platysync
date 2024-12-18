import fs from 'fs-extra';
import FormData from 'form-data';
import axios, { AxiosInstance } from "axios";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../operations.js";
import { getNestedValue } from "../providers/API.js";
import { Settings } from "../database.js";
import Operation from "../operation.js";
import { decrypt } from "../../modules/cryptography.js";

const ContentTypes: { [k: string]: string } = {
    text: "text/plain",
    form: "multipart/form-data",
    xml: "application/xml",
    json: "application/json",
    file: "application/octet-stream",
}

export default class TransAPIRequest extends Operation {
    endpoint!: string;
    auth!: string;
    password?: string;
    append?: string;
    target!: string;
    method!: string;
    mime!: string;
    data!: string;
    key!: string;
    form: FormDataValue[] = [];
    headers: FormDataValue[] = [];
    responsePath!: string;
    path!: string;
    response!: string;
    evaluation: boolean = false;
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        super.execute({ action, template, execute, data, ...rest });
        try {
            data.auth = action.auth;
            data.method = action.method;
            data.mime = action.mime;
            data.evaluation = String(action.evaluation);
            data.endpoint = compile(template, action.endpoint);
            data.target = compile(template, action.target);
            data.data = compile(template, action.data);
            data.key = compile(template, action.key);
            data.responsePath = compile(template, action.responsePath);
            if (action.password && typeof action.password !== 'string') data.password = await decrypt(action.password as Hash);
            if (action.auth==="basic") data.password = Buffer.from(data.password as string).toString('base64');
            const client =  await this.buildClient(data);
            if (!client) throw new xError("Client not connected.");
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
            const response = await client.request({
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
    private async buildClient( data: rString<TransAPIRequest>): Promise<AxiosInstance> {
        let url: URL|undefined;
        const settings = await Settings();
        if (settings.proxy_url) {
            url = new URL(settings.proxy_url);
            if (settings.proxy_username) url.username = settings.proxy_username;
            if (settings.proxy_password) url.password = settings.proxy_password as string;
        }
        let httpAgent;
        let httpsAgent;
        if (url) {
            httpAgent = new HttpProxyAgent(url.toString());
            httpsAgent = new HttpsProxyAgent(url.toString()); //if (url.username&&url.password) proxyAuth = `${url.username}:${url.password}`;
        }
        return axios.create({ //TODO - find a way to cache dupe clients
            baseURL: data.endpoint as string,
            httpAgent, httpsAgent,
            proxy: false,
            headers: !data.auth ? undefined : ( data.auth==="none" ? undefined : {
                Authorization :
                data.auth==="basic" ? `Basic ${data.password}` :
                (data.auth==="bearer" ? `Bearer ${data.password}` : undefined)
            }),
        });
    }
    
}