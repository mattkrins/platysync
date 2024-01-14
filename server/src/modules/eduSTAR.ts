import axios, { AxiosInstance, AxiosStatic } from 'axios';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CookieJar } from 'tough-cookie';
import { createCookieAgent } from 'http-cookie-agent/http';
import { JSDOM } from 'jsdom';
import { log, paths } from '../server.js';
import * as fs from 'node:fs';
import { Hash, decrypt, encrypt } from './cryptography.js';
const Axios = (axios as unknown as AxiosFix);

interface E {
    response: { data: { Message: string } }
}

export interface User {
    [id: string]: string
}

interface Cache {
    username: string;
    date: string;
    data: User[];
}

interface Options {
    school: string;
    cache?: string;
    proxy?: string|URL;
}

export interface AxiosFix extends AxiosStatic {
    default: AxiosStatic;
}

export default class eduSTAR {
    client: AxiosInstance;
    school: string;
    cachePolicy: number = 1440;
    username: string|undefined;
    jar = new CookieJar();
    constructor(options: Options) {
        let httpAgent;
        let httpsAgent;
        this.school = options.school;
        if (options.cache)  this.cachePolicy = Number(options.cache);
        if (options.proxy) {
            const url = new URL(options.proxy); // TODO: Add support for auth
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const HttpProxyCookieAgent: any = createCookieAgent(HttpProxyAgent);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const HttpsProxyCookieAgent: any = createCookieAgent(HttpsProxyAgent);
            httpAgent = new HttpProxyCookieAgent({ cookies: { jar: this.jar }, host: url.hostname, port: url.port });
            httpsAgent = new HttpsProxyCookieAgent({ cookies: { jar: this.jar }, host: url.hostname, port: url.port });
        }
        this.client = Axios.default.create({
            baseURL: 'https://apps.edustar.vic.edu.au',
            headers: { 'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.42' },
            httpAgent,
            httpsAgent,
            proxy: false,
        });
    }
    public async validate(): Promise<unknown> {
        try {
            const response = await this.client.get('/');
            log.debug(response);
            if (!response || !response.data) throw Error("No response.");
            if (!response.data.includes("Department of Education and Early Childhood Development")) throw Error("Malformed response.");
            return response.data;
        } catch (e) {
            const error = e as { response: {status: number}, message: string }
            if (error.response.status === 401) throw Error("401 Validation error. This is likely due to access behind a VPN.")
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
            log.debug(response);
            if (!response || !response.data) throw (Error("No response."));
            const cookies = await this.jar.getCookies(response.config.baseURL as string);
            if (!cookies || cookies.length <= 0){
                const dom = new JSDOM(response.data);
                const error = dom.window.document.querySelector('.wrng');
                if (error&&error.textContent){ throw (Error(error.textContent as string));}
                throw (Error("Unknown Error."));
            }
            this.username = username;
        } catch (e) {
            const error = e as { response: {status: number}, message: string }
            if (error.response.status === 401) throw Error("401 Validation error. This is likely due to access behind a VPN.")
            throw Error(error.message)
        }
    }
    public async getUsers(): Promise<User[]> {
        const cache = await this.getUserCache();
        if (!cache) return await this.download();
        if ((((new Date().valueOf()) - new Date(cache.date).valueOf())/1000/60) >= (this.cachePolicy)) {
            return await this.download();
        }
        return cache.data;
    }
    private async getUserCache(): Promise<Cache|undefined> {
        if (!fs.existsSync(`${paths.cache}/${this.school}.users.json`)) return;
        const cached: string = fs.readFileSync(`${paths.cache}/${this.school}.users.json`, 'utf8');
        const hash: Hash = JSON.parse(cached);
        const data = await decrypt(hash);
        const cache: Cache = JSON.parse(data);
        return cache
    }
    private async cache(data: object): Promise<void> {
        const cache = JSON.stringify({ date: new Date(), username: this.username, data });
        const hash = await encrypt(cache);
        fs.writeFileSync(`${paths.cache}/${this.school}.users.json`, JSON.stringify(hash));
    }
    private async download(): Promise<User[]> {
        try{
            const response = await this.client.get(`/edustarmc/api/MC/GetStudents/${this.school}/FULL`);
            if (!response || !response.data || typeof(response.data) !== "object") throw (Error("No response."));
            this.cache(response.data);
            return response.data
        } catch (e) {
            if ((e as E).response.data.Message&&(e as E).response.data.Message.includes("Object reference")) throw (Error("Incorrect School ID."));
            throw e;
        }
    }
}