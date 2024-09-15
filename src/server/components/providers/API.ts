import { isNotEmpty, validate, xError } from "../../modules/common";
import { Settings } from "../database";
import { base_provider, base_provider_options } from "./base";
import { createCookieAgent } from "http-cookie-agent/http";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import axios, { AxiosInstance } from "axios";
import { history, paths } from "../../..";
import fs from 'fs-extra';
import { decrypt, encrypt } from "../../modules/cryptography";
import { connections } from "../providers";
import { Engine } from "../engine";

interface cache {
    date: Date;
    data: Hash;
}

interface objectString {
    [k: string]: objectString;
}

function getNestedValue(o: objectString, s: string): any {
    s = s.replace(/\[(\w+)\]/g, '.$1');
    s = s.replace(/^\./, '');
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

function parseLinkHeader(header: string): { [key: string]: string } {
  const links: { [key: string]: string } = {};
  const parts = header.split(',');
  parts.forEach((part) => {
    const section = part.split(';');
    if (section.length !== 2) return;

    const url = section[0].replace(/<(.*)>/, '$1').trim();
    const name = section[1].replace(/rel="(.*)"/, '$1').trim();
    links[name] = url;
  });
  return links;
}

export interface api_options extends base_provider_options {
    endpoint: string;
    target: string;
    responsePath: string;
    auth: string;
    password: string|Hash;
    method: string;
    sendData: string;
    linkHeader: boolean;
    cache: number;
}

export default class API extends base_provider {
    private endpoint: string;
    private target: string;
    private responsePath: string;
    private auth: string;
    private password: string|Hash;
    private method: string;
    private sendData: string;
    private linkHeader: boolean;
    private cache: number;
    public client?: AxiosInstance;
    constructor(options: api_options, cache = 0) {
        super(options);
        this.endpoint = options.endpoint;
        this.target = options.target;
        this.responsePath = options.responsePath;
        this.auth = options.auth;
        this.password = options.password;
        this.method = options.method;
        this.sendData = options.sendData;
        this.linkHeader = options.linkHeader||false;
        this.cache = options.cache||cache;
    }
    public async validate() {
        validate( this, {
            endpoint: isNotEmpty('Endpoint can not be empty.'),
        });
        if (!this.client) throw new xError("Client not connected.");
        await this.download(false, false);
    }
    public async initialize() {
        await this.decrypt();
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
            const HttpProxyCookieAgent: any = createCookieAgent(HttpProxyAgent);
            const HttpsProxyCookieAgent: any = createCookieAgent(HttpsProxyAgent);
            let proxyAuth: undefined|string;
            if (url.username&&url.password) proxyAuth = `${url.username}:${url.password}`;
            httpAgent = new HttpProxyCookieAgent({ cookies: { jar: this.jar }, host: url.hostname, port: url.port, proxyAuth });
            httpsAgent = new HttpsProxyCookieAgent({ cookies: { jar: this.jar }, host: url.hostname, port: url.port });
        }
        this.client = axios.create({
            httpAgent, httpsAgent,
            proxy: false,
            headers: this.auth==="none" ? undefined : {
                Authorization :
                this.auth==="basic" ? `Basic ${this.password}` :
                (this.auth==="bearer" ? `Bearer ${this.password}` : undefined)
            },
        });
    }
    public async getHeaders(): Promise<string[]> {
        const data = await this.download(false, false);
        const headers = Object.keys(data[0]);
        return headers;
    }
    public async connect(_connectors: connections, engine: Engine): Promise<{ [k: string]: string }[]> {
        if (this.cache <=0) return await this.download(true, true, engine);
        if (!fs.existsSync(`${paths.cache}/API.${this.name}.json`)) return await this.download(true, true, engine);
        const file: string = fs.readFileSync(`${paths.cache}/API.${this.name}.json`, 'utf8');
        const cache = JSON.parse(file) as cache;
        if ((((new Date().valueOf()) - new Date(cache.date).valueOf())/1000/60) >= (this.cache)) return await this.download(true, true, engine);
        const data = JSON.parse(await decrypt(cache.data as Hash));
        this.data = data;
        return data;
    }
    private async download(page = true, cache = true, engine?: Engine): Promise<any> {
        if (engine) engine.Emit({ text: `Downloading '${this.name}' API data...` });
        if (!this.client) throw new xError("Client not connected.");
        try {
            let entries = [];
            if (this.linkHeader && page) {
                let url: string|null = `${this.endpoint}${this.target}`;
                while (url) {
                    try {
                        const response = await this.client.request({
                            url,
                            method: this.method||"get",
                            data: !this.sendData ? undefined : JSON.parse(this.sendData||"{}")
                        })
                        if (!Array.isArray(response.data)) throw new xError("Response data is not iterative.");
                        entries.push(...response.data);
                        const linkHeader = response.headers.link;
                        if (linkHeader) {
                            const links = parseLinkHeader(linkHeader);
                            if (links.next) {
                                if (links.next === url) {   
                                    url = null;
                                } else {
                                    url = links.next;
                                }
                            } else  {
                                url = null;
                            }
                        } else {
                          url = null;
                        }
                    } catch (e) {
                        url = null;
                        throw new xError(e);
                    }
                }
            } else {
                const response = await this.client.request({
                    url: `${this.endpoint}${this.target}`,
                    method: this.method||"get",
                    data: !this.sendData ? undefined : JSON.parse(this.sendData||"{}")
                })
                if (!response || !response.data || typeof(response.data) !== "object") throw Error("No response.");
                entries = response.data;
                if (this.responsePath) entries = getNestedValue(response.data, this.responsePath);
                if (!Array.isArray(entries)) throw new xError("Response data is not iterative.");
            }
            if (entries.length <= 0) throw new xError("Iterative data empty.");
            if (typeof(entries[0]) !== "object" ) throw new xError("Iterative data malformed.");
            this.data = entries;
            if (cache && this.cache > 0) {
                const encrypted = await encrypt(JSON.stringify(entries));
                const cache: cache = { date: new Date(), data: encrypted };
                fs.writeFileSync(`${paths.cache}/API.${this.name}.json`, JSON.stringify(cache));
            }
            return entries;
        } catch (e) {
            history.http(e);
            throw new xError((e as Error).message);
        }
    }
}
