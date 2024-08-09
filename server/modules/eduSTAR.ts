import axios, { AxiosInstance } from "axios";
import { createCookieAgent } from 'http-cookie-agent/http';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CookieJar } from 'tough-cookie';
import { JSDOM } from 'jsdom';
import * as fs from 'node:fs';
import { paths } from "../../server";
import { decrypt, encrypt } from "./cryptography";

export interface starAttributes {
  [k: string]: string;
  _login: string;
  _class: string;
  _cn: string;
  _desc: string;
  _disabled: string;
  _displayName: string;
  _dn: string;
  _firstName: string;
  _google: string;
  _intune: string;
  _lastLogon: string;
  _lastName: string;
  _lastPwdResetViaMC: string;
  _lockedOut: string;
  _o365: string;
  _pwdExpired: string;
  _pwdExpires: string;
  _pwdLastSet: string;
  _pwdNeverExpires: string;
  _pwdResetAction: string;
  _pwdResetTech: string;
  _yammer: string;
}

interface cache {
    date: Date;
    data: Hash;
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
    private students: starAttributes[] = [];
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
                if (!error||!error.textContent) throw Error("Unknown Error.");
                if (error.textContent.includes("You could not be logged on to Forefront TMG")) throw Error("Username or Password incorrect.");
                throw Error(error.textContent as string);
            }
        } catch (e) {
            const { message } = e as { response: {status: number}, message: string }
            throw Error(message);
        }
    }
    public async getStudents(): Promise<starAttributes[]> {
        if (this.students && this.students.length > 0) return this.students;
        if (!fs.existsSync(`${paths.cache}/${this.school}.students.json`)) return await this.downloadStudents();
        const file: string = fs.readFileSync(`${paths.cache}/${this.school}.users.json`, 'utf8');
        const cache = JSON.parse(file) as cache;
        if ((((new Date().valueOf()) - new Date(cache.date).valueOf())/1000/60) >= (this.cachePolicy)) return await this.downloadStudents();
        const students = JSON.parse(await decrypt(cache.data as Hash)) as starAttributes[];
        this.students = students;
        return students;
    }
    private async downloadStudents(): Promise<starAttributes[]> {
        try {
            const response = await this.client.get(`/edustarmc/api/MC/GetStudents/${this.school}/FULL`);
            if (!response || !response.data || typeof(response.data) !== "object") throw Error("No response.");
            const encrypted = await encrypt(JSON.stringify(response.data));
            const cache: cache = { date: new Date(), data: encrypted };
            fs.writeFileSync(`${paths.cache}/${this.school}.students.json`, JSON.stringify(cache));
            return response.data as starAttributes[];
        } catch (e) {
            const { message } = e as { response: {status: number}, message: string };
            if (message.includes("Object reference")) throw Error("Incorrect School ID.");
            throw Error(message);
        }
    }
    public async getStudentsMatchSTKEY(eduhub: { [k: string]: string }[]): Promise<starAttributes[]> {
        const collator = new Intl.Collator(undefined, { sensitivity: "accent" });
        const calculateScore = (star: starAttributes, hub: { [k: string]: string }) => {
            let score = 0;
            const PREF_DISPLAY_NAME = `${hub.PREF_NAME} ${hub.SURNAME}`;
            const DISPLAY_NAME = `${hub.FIRST_NAME} ${hub.SURNAME}`;
            if (collator.compare(star._displayName, PREF_DISPLAY_NAME) === 0) score += 5;
            if (collator.compare(star._displayName, DISPLAY_NAME) === 0) score += 4;
            if (collator.compare(star._firstName, hub.FIRST_NAME) === 0) score += 3;
            if (collator.compare(star._lastName, hub.SURNAME) === 0) score += 3;
            if (score < 4) return 0;
            if (collator.compare(star._login[0], hub.FIRST_NAME[0]) === 0) score += 2;
            if (collator.compare(star._login[2], hub.SURNAME[0]) === 0) score += 1;
            if (collator.compare(star._login[1], hub.SURNAME[0]) === 0) score += 1;
            if (collator.compare(star._class, hub.HOME_GROUP) === 0) score += 1;
            if (collator.compare(star._desc, hub.SCHOOL_YEAR) === 0) score += 1;
            if (hub.STATUS==="ACTV") score += 1;
            if (!star._disabled) score += 1;
            return score;
        }
        const inactive = ["LEFT","LVNG","DEL"];
        const students = await this.getStudents();
        return students.map(star => {
            let bestMatch;
            let bestScore = -1;
            for (const hub of eduhub) {
                if (!this.includeInactive && inactive.includes(hub.STATUS)) continue;
                const score = calculateScore(star, hub);
                if (score===0) continue;
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = hub;
                } else if (score === bestScore) { //REVIEW - Multiple matches found; maybe a UI option to decide what to do
                    bestMatch = hub;
                }
            }
            return { ...star, _stkey: bestMatch ? bestMatch.STKEY : "" };
        });

    }
}