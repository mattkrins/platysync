import axios, { AxiosInstance } from "axios";
import { createCookieAgent } from 'http-cookie-agent/http';
import { HttpProxyAgent, HttpProxyAgentOptions } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CookieJar } from 'tough-cookie';
import { JSDOM } from 'jsdom';

interface Cache {
    date: string;
    data: Record<string, string>;
}

interface Options {
    school: string;
    cache?: number;
    includeInactive?: boolean;
    proxy?: URL|string;
}

export default class eduSTAR {
    private client: AxiosInstance;
    private school: string;
    private cachePolicy: number = 1440;
    private includeInactive: boolean;
    private jar = new CookieJar();
    constructor(options: Options) {
        this.school = options.school;
        this.cachePolicy = options.cache || 1440;
        this.includeInactive = options.includeInactive || false;
        let httpAgent;
        let httpsAgent;
        if (options.proxy) {
            const url = new URL(options.proxy);
            const HttpProxyCookieAgent: any = createCookieAgent(HttpProxyAgent);
            const HttpsProxyCookieAgent: any = createCookieAgent(HttpsProxyAgent);
            let proxyAuth: undefined|string;
            if (url.username&&url.password) proxyAuth = `${url.username}:${url.password}`;
            httpAgent = new HttpProxyCookieAgent({ cookies: { jar: this.jar }, host: url.hostname, port: url.port, proxyAuth });
            httpsAgent = new HttpsProxyCookieAgent({ cookies: { jar: this.jar }, host: url.hostname, port: url.port });
        }
        this.client = axios.create({
            baseURL: 'https://apps.edustar.vic.edu.au',
            headers: { 'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.42' },
            httpAgent, httpsAgent,
            proxy: false,
        });
    }
    public async validate(): Promise<unknown> {
        try {
            const response = await this.client.get('/');
            if (!response || !response.data) throw Error("No response.");
            if (!response.data.includes("Department of Education and Early Childhood Development")) throw Error("Malformed response.");
            return response.data;
        } catch (e) {
            const error = e as { response: {status: number}, message: string }
            if (error.response && error.response.status === 403) throw Error("Not connected to edu-intranet.");
            if (error.response && error.response.status === 401) throw Error("401 Validation error. This is likely due to access behind a VPN.");
            throw Error(error.message)
        }
    }
    public async login(username: string, password: string): Promise<void> {
        const data = {
            username,
            password,
            SubmitCreds: 'Log in',
            trusted: '0',
            formdir: '3',
            forcedownlevel: '0',
            flags: '0',
            curl: 'Z2FedustarmcZ2Fstudent_passwords',
        };
        const searchParams = new URLSearchParams(data);
        const encoded = searchParams.toString();
        try {
            const response = await this.client.post("/CookieAuth.dll?Logon", encoded);
            if (!response || !response.data) throw Error("No response.");
            const cookies = await this.jar.getCookies(response.config.baseURL as string);
            if (!cookies || cookies.length <= 0){
                const dom = new JSDOM(response.data);
                const error = dom.window.document.querySelector('.wrng');
                if (error&&error.textContent){ throw Error(error.textContent as string);}
                throw Error("Unknown Error.");
            }
        } catch (e) {
            const { message } = e as { response: {status: number}, message: string }
            throw Error(message);
        }
    }
}