import axios, { AxiosInstance } from "axios";
import { createCookieAgent } from 'http-cookie-agent/http';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { JSDOM } from 'jsdom';
import * as fs from 'node:fs';
import { paths } from "../../index.js";
import { decrypt, encrypt } from "./cryptography.js";

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

export type passwordPayload = { _login: string, _pass: string }[];

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
    public client: AxiosInstance;
    public school: string;
    private cachePolicy: number = 1440;
    private includeInactive: boolean;
    private jar = new CookieJar();
    private students: starAttributes[] = [];
    public alert?: (status: string) => unknown;
    constructor(options: Options) {
        this.school = options.school;
        this.cachePolicy = options.cache || 1440;
        this.includeInactive = options.includeInactive || false;
        let httpAgent;
        let httpsAgent;
        if (options.proxy) {
            const url = new URL(options.proxy);
            const HttpProxyCookieAgent = createCookieAgent(HttpProxyAgent);
            const HttpsProxyCookieAgent = createCookieAgent(HttpsProxyAgent);
            let proxyAuth: undefined|string;
            if (url.username&&url.password) proxyAuth = `${url.username}:${url.password}`;
            httpAgent = new HttpProxyCookieAgent({ cookies: { jar: this.jar }, host: url.hostname, port: url.port, proxyAuth } as unknown as URL);
            httpsAgent = new HttpsProxyCookieAgent({ cookies: { jar: this.jar }, host: url.hostname, port: url.port } as unknown as URL);
            this.client = axios.create({
                baseURL: 'https://apps.edustar.vic.edu.au',
                headers: { 
                    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://apps.edustar.vic.edu.au/edustarmc/',
                },
                httpAgent, httpsAgent,
                proxy: false,
            });
        } else {
            this.client = wrapper(axios.create({
                baseURL: 'https://apps.edustar.vic.edu.au',
                headers: { 
                    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://apps.edustar.vic.edu.au/edustarmc/',
                },
                jar: this.jar
            }));
        }

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
        const maxAttempts = 3;
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < maxAttempts) {
            attempt++;
            try {
                // Step 1: Get the login page first to handle any session conflicts
                const loginPageResponse = await this.client.get('/edustarmc/');
                
                // Step 2: Check for session conflict
                if (loginPageResponse.data && loginPageResponse.data.includes('Access policy evaluation is already in progress')) {
                    console.log('Detected session conflict, extracting newsession URI...');
                    
                    const newSessionPattern = /"newsession",\s*"uri":\s*"([^"]*)"/;
                    const newsessionMatch = loginPageResponse.data.match(newSessionPattern);
                    
                    if (newsessionMatch && newsessionMatch[1]) {
                        const newsessionUri = newsessionMatch[1];
                        console.log('Found newsession URI, creating new session...');
                        
                        const newSessionUrl = `/logon.php3?${newsessionUri}`;
                        await this.client.get(newSessionUrl);
                        
                        // Wait a bit for the session to be established
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }

                // Step 3: Prepare authentication data
                const data = {
                    curl: 'Z2Fedustarmc',
                    username,
                    password,
                    SubmitCreds: 'Log+in',
                };
                const searchParams = new URLSearchParams(data);
                const encoded = searchParams.toString();

                // Step 4: Submit credentials to the new endpoint with enhanced headers
                const authHeaders = {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Referer': 'https://apps.edustar.vic.edu.au/edustarmc/',
                };

                const response = await this.client.post("/my.policy", encoded, { headers: authHeaders });
                
                if (!response || !response.data) throw Error("No response.");

                // Step 5: Verify cookies were set
                const cookies = await this.jar.getCookies(response.config.baseURL as string);
                if (!cookies || cookies.length <= 0) {
                    console.error('Authentication failed - no cookies received');
                    const dom = new JSDOM(response.data);
                    const error = dom.window.document.querySelector('.wrng');
                    if (!error || !error.textContent) throw Error("Unknown Error - no cookies received.");
                    if (error.textContent.includes("You could not be logged on to Forefront TMG")) throw Error("Username or Password incorrect.");
                    throw Error(error.textContent as string);
                }

                // Step 6: Test the connection by making an API call
                try {
                    await this.client.get('/edustarmc/api/MC/GetUser');
                    console.log('Login successful - connection verified');
                    return; // Success!
                } catch (testError) {
                    throw Error("Authentication appeared successful but API test failed.");
                }

            } catch (e) {
                const { message } = e as { response: { status: number }, message: string };
                lastError = new Error(message);
                console.error(`Login attempt ${attempt} of ${maxAttempts} failed: ${message}`);
                
                if (attempt < maxAttempts) {
                    console.log('Waiting before retry...');
                    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds before retry
                }
            }
        }

        // If we get here, all attempts failed
        throw lastError || Error("All login attempts failed.");
    }
    public async getStudents(): Promise<starAttributes[]> {
        if (this.students && this.students.length > 0) return this.students;
        if (!fs.existsSync(`${paths.cache}/STMC.${this.school}.students.json`)) return await this.downloadStudents();
        const file: string = fs.readFileSync(`${paths.cache}/STMC.${this.school}.students.json`, 'utf8');
        const cache = JSON.parse(file) as cache;
        if ((((new Date().valueOf()) - new Date(cache.date).valueOf())/1000/60) >= (this.cachePolicy)) return await this.downloadStudents();
        const students = JSON.parse(await decrypt(cache.data as Hash)) as starAttributes[];
        this.students = students;
        return students;
    }
    private async downloadStudents(): Promise<starAttributes[]> {
        try {
            if (this.alert) this.alert('Downloading students...');
            const response = await this.client.get(`/edustarmc/api/MC/GetStudents/${this.school}/FULL`);
            if (!response || !response.data || typeof(response.data) !== "object") throw Error("No response.");
            const encrypted = await encrypt(JSON.stringify(response.data));
            const cache: cache = { date: new Date(), data: encrypted };
            fs.writeFileSync(`${paths.cache}/STMC.${this.school}.students.json`, JSON.stringify(cache));
            return response.data as starAttributes[];
        } catch (e) {
            const { message } = e as { response: {status: number}, message: string };
            if (message.includes("Object reference")) throw Error("Incorrect School ID.");
            throw Error(message);
        }
    }
    private async downloadStaff(): Promise<starAttributes[]> { //TODO - find response schema
        try {
            if (this.alert) this.alert('Downloading staff...');
            const response = await this.client.get(`/edustarmc/api/MC/GetSchoolTechs/${this.school}/true`);
            if (!response || !response.data || typeof(response.data) !== "object") throw Error("No response.");
            const encrypted = await encrypt(JSON.stringify(response.data));
            const cache: cache = { date: new Date(), data: encrypted };
            fs.writeFileSync(`${paths.cache}/STMC.${this.school}.staff.json`, JSON.stringify(cache));
            return response.data as starAttributes[];
        } catch (e) {
            const { message } = e as { response: {status: number}, message: string };
            if (message.includes("Object reference")) throw Error("Incorrect School ID.");
            throw Error(message);
        }
    }
    public async setStudentPassword(dn: string, newPass: string): Promise<true> {
        try {
            const data = { dn, newPass, schoolId: this.school };
            await this.client.post(`/edustarmc/api/MC/ResetStudentPwd`, data);
            return true;
        } catch (e) {
            const { message : defMess, response } = e as { response: { status: number, data?: { Message?: string  } }, message: string };
            const message = response.data?.Message||defMess;
            if (message.includes("reference not set")) throw Error("Incorrect School ID.");
            if (message.includes("target of an invocation")) throw Error("Password does not meet complexity requirements.");
            if (message.includes("no such object")) throw Error("DN incorrect / not found.");
            throw Error(message);
        }
    }
    public async setStudentPasswords(payload: passwordPayload): Promise<{ [id: string]: string }[]> {
        try {
            const data: { _schoolId: string, _rows: passwordPayload } = { "_schoolId" : this.school, "_rows" : payload };
            const response = await this.client.post(`/edustarmc/api/MC/BulkSetPasswordCSV`, data);
            if (!response || !response.data || typeof(response.data) !== "object") throw Error("No response.");
            const results = (response.data || []) as {_outcome: string}[];
            if (results.length <= 0) throw Error("Invalid response.");
            const errors = results.filter(r=>r._outcome!=="OK");
            if (errors.length > 0) throw new Error(`Error setting passwords: ${JSON.stringify(errors)}`);
            return response.data;
        } catch (e) {
            const { message : defMess, response } = e as { response: { status: number, data?: { Message?: string  } }, message: string };
            const message = response.data?.Message||defMess;
            if (message.includes("reference not set")) throw Error("Incorrect School ID.");
            throw Error(message);
        }
    }
    public async getStudentsMatchSTKEY(eduhub: { [k: string]: string }[]): Promise<starAttributes[]> {
        //TODO - add option to specify eduhub column and skip scoring
        if (this.alert) this.alert('Matching eduhub data...');
        const collator = new Intl.Collator(undefined, { sensitivity: "base" });
        const calculateScore = (star: starAttributes, hub: { [k: string]: string }) => {
            let score = 0;
            const PREF_DISPLAY_NAME = `${hub.PREF_NAME} ${hub.SURNAME}`;
            const DISPLAY_NAME = `${hub.FIRST_NAME} ${hub.SURNAME}`;
            if ((hub.E_MAIL.toLowerCase()).includes(star._login.toLowerCase())) score += 5;
            if (collator.compare(star._displayName, PREF_DISPLAY_NAME) === 0) score += 5;
            if (collator.compare(star._displayName, DISPLAY_NAME) === 0) score += 4;
            if (collator.compare(star._firstName, hub.FIRST_NAME) === 0) score += 3;
            if (collator.compare(star._lastName, hub.SURNAME) === 0) score += 3;
            if (score < 3) return -1;
            const stkey_slice = hub.STKEY.slice(0, 3);
            if (collator.compare(star._lastName.slice(0, 3), stkey_slice) === 0) score += 3;
            if (score < 3) return -1;
            if (collator.compare(star._login[0], hub.FIRST_NAME[0]) === 0) score += 2;
            if (collator.compare(star._login[2], hub.SURNAME[0]) === 0) score += 1;
            if (collator.compare(star._login[1], hub.SURNAME[0]) === 0) score += 1;
            if (collator.compare(star._class, hub.HOME_GROUP) === 0) score += 1;
            if (collator.compare(star._desc, hub.SCHOOL_YEAR) === 0) score += 1;
            if (star._login.includes(stkey_slice)) score += 1;
            if (star._lastLogon) score += 1;
            if (this.includeInactive && hub.STATUS==="ACTV") score += 1;
            if (!star._disabled) score += 1;
            return score;
        }
        const students = await this.getStudents();
        const filtered = this.includeInactive ? eduhub :
        eduhub.filter(hub=>hub.STATUS==="ACTV"||hub.STATUS==="FUT");
        return students.map(star => {
            let bestMatch;
            let bestScore = -1;
            for (const hub of filtered) {
                const score = calculateScore(star, hub);
                if (score<=0) continue;
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = hub;
                } else if (score === bestScore) { //REVIEW - Multiple matches found; maybe a UI option to decide what to do
                    bestMatch = hub;
                }
            }
            return { ...star, _stkey: bestMatch ? bestMatch.STKEY : "", _score: String(bestScore) };
        });

    }
}


// add wireless cert
// https://apps.edustar.vic.edu.au/edustarmc/api/MC/AddManagedComputer?schoolId=8827&computerName=8827-test&password=eduSTAR.NETx

// enable intune
// POST https://apps.edustar.vic.edu.au/edustarmc/api/MC/SetO365 :
// {"_dns":["CN=name,OU=Accounts,DC=services,DC=education,DC=vic,DC=gov,DC=au"],"_accountType":"student","_schoolId":"8827","_property":"intune","_value":null}
// response: ["OK-CN=name,OU=Accounts,DC=services,DC=education,DC=vic,DC=gov,DC=au"]
// enable google
// POST https://apps.edustar.vic.edu.au/edustarmc/api/MC/SetO365 :
// {"_dns":["CN=name,OU=Accounts,DC=services,DC=education,DC=vic,DC=gov,DC=au"],"_accountType":"student","_schoolId":"8827","_property":"add_google_ws","_value":null}
// disable google
// POST https://apps.edustar.vic.edu.au/edustarmc/api/MC/SetO365 :
// {"_dns":["CN=name,OU=Accounts,DC=services,DC=education,DC=vic,DC=gov,DC=au"],"_accountType":"student","_schoolId":"8827","_property":"remove_google_ws","_value":null}
// disable intune
// POST https://apps.edustar.vic.edu.au/edustarmc/api/MC/UnsetO365 :
// {"_dns":["CN=name,OU=Accounts,DC=services,DC=education,DC=vic,DC=gov,DC=au"],"_accountType":"student","_schoolId":"8827","_property":"intune","_value":null}
// get group members
// https://apps.edustar.vic.edu.au/edustarmc/api/MC/GetGroupMembers?schoolId=8827
// &groupDn=CN%3D8827-gs-Specialist%20Technician%2COU%3DSchool%20Groups%2COU%3DCentral%2CDC%3Dservices%2CDC%3Deducation%2CDC%3Dvic%2CDC%3Dgov%2CDC%3Dau&groupName=8827-gs-Specialist%20Technician
