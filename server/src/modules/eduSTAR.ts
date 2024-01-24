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
    eduhub?: {[k: string]: string}[];
}

export type passwordPayload = { _login: string, _pass: string }[];

export interface AxiosFix extends AxiosStatic {
    default: AxiosStatic;
}

export default class eduSTAR {
    public client: AxiosInstance;
    private school: string;
    private cachePolicy: number = 1440;
    private username: string|undefined;
    private jar = new CookieJar();
    private users: User[];
    private eduhub?: {[k: string]: string}[];
    constructor(options: Options) {
        this.users = [];
        let httpAgent;
        let httpsAgent;
        this.school = options.school;
        this.eduhub = options.eduhub;
        if (options.cache) this.cachePolicy = Number(options.cache);
        if (options.proxy) {
            const url = new URL(options.proxy);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const HttpProxyCookieAgent: any = createCookieAgent(HttpProxyAgent);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const HttpsProxyCookieAgent: any = createCookieAgent(HttpsProxyAgent);
            let proxyAuth: undefined|string;
            if (url.username&&url.password) proxyAuth = `${url.username}:${url.password}`;
            httpAgent = new HttpProxyCookieAgent({ cookies: { jar: this.jar }, host: url.hostname, port: url.port, proxyAuth });
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
            if (error.response && error.response.status === 401) throw Error("401 Validation error. This is likely due to access behind a VPN.")
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
            if (!response || !response.data) throw Error("No response.");
            const cookies = await this.jar.getCookies(response.config.baseURL as string);
            if (!cookies || cookies.length <= 0){
                const dom = new JSDOM(response.data);
                const error = dom.window.document.querySelector('.wrng');
                if (error&&error.textContent){ throw Error(error.textContent as string);}
                throw Error("Unknown Error.");
            }
            this.username = username;
        } catch (e) {
            const error = e as { response: {status: number}, message: string }
            if (error.response && error.response.status === 401) throw Error("401 Validation error. This is likely due to access behind a VPN.")
            throw Error(error.message)
        }
    }
    public async getUsers(): Promise<User[]> {
        const cache = await this.getUserCache();
        const ret = (users: User[]) => { this.users = users; return this.users; };
        if (!cache) return ret(await this.download());
        if ((((new Date().valueOf()) - new Date(cache.date).valueOf())/1000/60) >= (this.cachePolicy)) return ret(await this.download());
        return ret(cache.data);
    }
    private async getUserCache(): Promise<Cache|undefined> {
        if (!fs.existsSync(`${paths.cache}/${this.school}.users.json`)) return;
        try {
            const cached: string = fs.readFileSync(`${paths.cache}/${this.school}.users.json`, 'utf8');
            const hash: Hash = JSON.parse(cached);
            const data = await decrypt(hash);
            const cache: Cache = JSON.parse(data);
            return cache;
        } catch (e) { log.warn("Failed to read STMC cache."); return; }
    }
    private async cache(data: object): Promise<void> {
        const cache = JSON.stringify({ date: new Date(), username: this.username, data });
        const hash = await encrypt(cache);
        fs.writeFileSync(`${paths.cache}/${this.school}.users.json`, JSON.stringify(hash));
    }
    private async download(): Promise<User[]> {
        try {
            const response = await this.client.get(`/edustarmc/api/MC/GetStudents/${this.school}/FULL`);
            if (!response || !response.data || typeof(response.data) !== "object") throw Error("No response.");
            this.cache(response.data);
            return response.data
        } catch (e) {
            if ((e as E).response.data.Message&&(e as E).response.data.Message.includes("Object reference")) throw Error("Incorrect School ID.");
            throw e;
        }
    }
    public async upload(payload: passwordPayload): Promise<User[]> {
        try {
            const data: { _schoolId: string, _rows: passwordPayload } = { "_schoolId" : this.school, "_rows" : payload };
            const response = await this.client.post(`/edustarmc/api/MC/BulkSetPasswordCSV`, data);
            if (!response || !response.data || typeof(response.data) !== "object") throw Error("No response.");
            const results = (response.data || []) as {_outcome: string}[];
            if (results.length <= 0) throw Error("Invalid response."); //
            const errors = results.filter(r=>r._outcome!=="OK");
            if (errors.length > 0) throw new Error(`Error setting passwords: ${JSON.stringify(errors)}`);
            return response.data;
        } catch (e) {
            if ((e as E).response.data.Message&&(e as E).response.data.Message.includes("Object reference")) throw Error("Incorrect School ID.");
            throw e;
        }
    }
    public bindEduhub() {
        for (const row in this.users||[]) {
            const starUser = this.users[row];
            const possible_matches: { hits: number, starUser: User, hubUser: {[k: string]: string} }[] = [];
            for (const hubUser of this.eduhub||[]) {
                if (["LEFT","LVNG","DEL"].includes(hubUser.STATUS)) continue; //REVIEW - this should be a gui toggle; saves time but some may want these matches.
                if (!hubUser.STKEY || !hubUser.SURNAME) continue;
                let hits = 0;
                const DISPLAY_NAME = `${hubUser.PREF_NAME} ${hubUser.SURNAME}`;
                const LASTNAME_ABREV = hubUser.SURNAME.trim().toLowerCase().slice(0, 3);
                if (starUser._displayName===DISPLAY_NAME) hits++;
                if (starUser._displayName.trim().toLowerCase()===DISPLAY_NAME.trim().toLowerCase()) hits++;
                if (starUser._firstName===hubUser.FIRST_NAME) hits++;
                if (starUser._firstName===hubUser.PREF_NAME) hits++;
                if (starUser._firstName.trim().toLowerCase()===hubUser.PREF_NAME.trim().toLowerCase()) hits++;
                if (starUser._firstName.trim().toLowerCase()===hubUser.FIRST_NAME.trim().toLowerCase()) hits++;
                if (starUser._lastName===hubUser.SURNAME) hits++;
                if (starUser._lastName.trim().toLowerCase()===hubUser.SURNAME.trim().toLowerCase()) hits++;
                if (hits<=0) continue;
                if (starUser._login.trim().toLowerCase()[0]===hubUser.FIRST_NAME.trim().toLowerCase()[0]) hits++;
                if (starUser._login.trim().toLowerCase().slice(-3).includes(LASTNAME_ABREV)) hits++;
                if (starUser._login.slice(-3)===hubUser.SURNAME) hits++;
                if (starUser._class.trim().toLowerCase()===hubUser.HOME_GROUP.trim().toLowerCase()) hits++;
                if (starUser._desc===hubUser.SCHOOL_YEAR) hits++;
                if (hubUser.STATUS==="ACTV") hits++;
                if (!starUser._disabled) hits++;
                possible_matches.push({hits, starUser, hubUser});
            }
            if (possible_matches.length<=0) continue;
            const best_match = possible_matches.reduce(function(prev, current) {
                return (prev && prev.hits > current.hits) ? prev : current
            }) //TODO - make gui toggle to ensure certainty; maybe a slider?
            if (!best_match) continue;
            this.users[row]._eduhub = best_match.hubUser.STKEY;
        }
        return this.users;
    }
}