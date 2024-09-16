import { Settings } from "../database";
import { base_config, configs } from "./base";
import axios, { AxiosInstance } from "axios";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";

export default class API extends base_config {
    public dataKeys: string[] = ['endpoint', 'auth', 'append', 'method', 'mime', 'target', 'data', 'response', 'responsePath', 'key', 'headers'];
    public client?: AxiosInstance;
    [k: string]: unknown;
    constructor(schema: Schema, options: Partial<base_config>, name?: string) {
        super(schema, options, name);
        if (!this.port) this.port = 25;
        if (!this.from) this.from = this.username;
        if (!this.text) this.text = undefined;
        if (!this.html) this.html = undefined;
    }
    public async initialize(configs: configs): Promise<void> {
        await super.initialize(configs);
        if (this.auth==="basic") this.password = Buffer.from(this.password as string).toString('base64');
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
            let proxyAuth: undefined|string;
            if (url.username&&url.password) proxyAuth = `${url.username}:${url.password}`;
            httpAgent = new HttpProxyAgent(url.toString());
            httpsAgent = new HttpsProxyAgent(url.toString());
        }
        this.client = axios.create({
            baseURL: this.endpoint as string,
            httpAgent, httpsAgent,
            proxy: false,
            headers: this.auth==="none" ? undefined : {
                Authorization :
                this.auth==="basic" ? `Basic ${this.password}` :
                (this.auth==="bearer" ? `Bearer ${this.password}` : undefined)
            },
        });
    }

}
