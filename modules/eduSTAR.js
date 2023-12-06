import axios from 'axios';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CookieJar } from 'tough-cookie';
import { createCookieAgent } from 'http-cookie-agent/http';
import { JSDOM } from 'jsdom';
import { paths } from '../server.js';
import * as fs from 'node:fs';
import { decrypt, encrypt } from './cryptography.js';
const Axios = axios;
export default class eduSTAR {
    constructor(options) {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "school", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cachePolicy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1440
        });
        Object.defineProperty(this, "username", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "jar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new CookieJar()
        });
        let httpAgent;
        let httpsAgent;
        this.school = options.school;
        if (options.cache)
            this.cachePolicy = Number(options.cache);
        if (options.proxy) {
            const url = new URL(options.proxy); // TODO: Add support for auth
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const HttpProxyCookieAgent = createCookieAgent(HttpProxyAgent);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const HttpsProxyCookieAgent = createCookieAgent(HttpsProxyAgent);
            httpAgent = new HttpProxyCookieAgent({ cookies: { jar: this.jar }, host: url.hostname, port: url.port });
            httpsAgent = new HttpsProxyCookieAgent({ cookies: { jar: this.jar }, host: url.hostname, port: url.port });
        }
        this.client = Axios.default.create({
            baseURL: 'https://apps.edustar.vic.edu.au',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.42' },
            httpAgent,
            httpsAgent,
            proxy: false,
        });
    }
    async validate() {
        const response = await this.client.get('/');
        if (!response || !response.data)
            throw (Error("No response."));
        if (!response.data.includes("Department of Education and Early Childhood Development"))
            throw (Error("Malformed response."));
        return response.data;
    }
    async login(username, password) {
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
        const response = await this.client.post("/CookieAuth.dll?Logon", encoded);
        if (!response || !response.data)
            throw (Error("No response."));
        const cookies = await this.jar.getCookies(response.config.baseURL);
        if (!cookies || cookies.length <= 0) {
            const dom = new JSDOM(response.data);
            const error = dom.window.document.querySelector('.wrng');
            if (error && error.textContent) {
                throw (Error(error.textContent));
            }
            throw (Error("Unknown Error."));
        }
        this.username = username;
    }
    async getUsers() {
        const cache = await this.getUserCache();
        if (!cache)
            return await this.download();
        if ((((new Date().valueOf()) - new Date(cache.date).valueOf()) / 1000 / 60) >= (this.cachePolicy)) {
            return await this.download();
        }
        return cache.data;
    }
    async getUserCache() {
        if (!fs.existsSync(`${paths.cache}/${this.school}.users.json`))
            return;
        const cached = fs.readFileSync(`${paths.cache}/${this.school}.users.json`, 'utf8');
        const hash = JSON.parse(cached);
        const data = await decrypt(hash);
        const cache = JSON.parse(data);
        return cache;
    }
    async cache(data) {
        const cache = JSON.stringify({ date: new Date(), username: this.username, data });
        const hash = await encrypt(cache);
        fs.writeFileSync(`${paths.cache}/${this.school}.users.json`, JSON.stringify(hash));
    }
    async download() {
        try {
            const response = await this.client.get(`/edustarmc/api/MC/GetStudents/${this.school}/FULL`);
            if (!response || !response.data || typeof (response.data) !== "object")
                throw (Error("No response."));
            this.cache(response.data);
            return response.data;
        }
        catch (e) {
            if (e.response.data.Message && e.response.data.Message.includes("Object reference"))
                throw (Error("Incorrect School ID."));
            throw e;
        }
    }
}
