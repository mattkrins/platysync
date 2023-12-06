import { Setting } from "../../db/models.js";
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { createCookieAgent, HttpCookieAgent, HttpsCookieAgent } from 'http-cookie-agent/http';
import httpProxyAgent from 'http-proxy-agent';
import httpsProxyAgent from 'https-proxy-agent';
import { parse } from 'node-html-parser';
import { decrypt, getKey } from './cryptography.js';
import querystring from 'querystring';
import fs from 'fs';
import { storagePath } from '../../db/database.js';

export const eduSTARCache = `${storagePath}/eduSTAR_cache.json`;

export async function getSettings(settings){
    let password = settings.password || false;
    try {
        password = JSON.parse(settings.password);
    } catch (e) {
        // Password has been modified
    }
    if (password && (!password.iv) && settings.password.trim()!==""){
        // Password is unsaved & in clear text
        password = settings.password;
    } else {
        // Password is saved & encrypted
        const edustar_pass = await Setting.findOne({where:{ key: "edustar_pass" }, raw: true});
        if (edustar_pass&&(edustar_pass.value||"").trim()!==""){
            const key = await getKey();
            password = await decrypt(edustar_pass.value, key);
        }
    }
    let username = settings.username || false;
    if (!username||username.trim()===""){
        const edustar_user = await Setting.findOne({where:{ key: "edustar_user" }, raw: true}) || {};
        username = edustar_user.value || "";
    }
    let schoolID = settings.schoolID || false;
    if (!schoolID||schoolID.trim()===""){
        const school_id = await Setting.findOne({where:{ key: "school_id" }, raw: true});
        schoolID = school_id && school_id.value;
    }
    let proxy = settings.proxy || false;
    if (!proxy||proxy.trim()===""){
        const {value: saved_proxy} = await Setting.findOne({where:{ key: "proxy" }, raw: true}) || {};
        if (saved_proxy && (saved_proxy.value||"").trim()!=="") {
            proxy = saved_proxy||"";
        }
    }
    return { ...settings, username, password, proxy, schoolID }
}

export default class eduSTAR {
    client;
    proxy;
    username;
    password;
    schoolID;
    matches;
    cachePolicy = 24;
    users = false;
    constructor(settings={}) {
        Object.assign(this, settings);
    }
    init = async () => {
        const setts = await getSettings(this);
        Object.assign(this, setts);
        const jar = new CookieJar();
        this.jar = jar;
        let httpAgent = new HttpCookieAgent({ cookies: { jar: jar } });
        let httpsAgent = new HttpsCookieAgent({ cookies: { jar: jar } });
        if (this.proxy) {
            const url = new URL(this.proxy);
            const HttpProxyCookieAgent = createCookieAgent(httpProxyAgent.HttpProxyAgent);
            const HttpsProxyCookieAgent = createCookieAgent(httpsProxyAgent.HttpsProxyAgent);
            httpAgent = new HttpProxyCookieAgent({ cookies: { jar: jar }, host: url.hostname, port: url.port });
            httpsAgent = new HttpsProxyCookieAgent({ cookies: { jar: jar }, host: url.hostname, port: url.port });
        }
        this.client = axios.create({
            headers: { 'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.42' },
            httpAgent,
            httpsAgent,
            proxy: false,
        });
    }
    login = async () => {
        const self = this;
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const data = {
                    'username': self.username,
                    'password': self.password,
                    'SubmitCreds': 'Log in',
                    'trusted': '0',
                    'formdir': '3',
                    'forcedownlevel': '0',
                    'flags': '0',
                    'curl': 'Z2FedustarmcZ2Fstudent_passwords',
                };
                const encoded = querystring.stringify(data);
                self.client.post("https://apps.edustar.vic.edu.au/CookieAuth.dll?Logon", encoded)
                .then((res)=>{
                    if (!res || !res.data) return reject(new Error('No response'));
                    self.jar.getCookies('https://apps.edustar.vic.edu.au').then((cookies) => {
                        if (!cookies || cookies.length <= 0){
                            const root = parse(res.data);
                            const error = root.querySelector('.wrng').text;
                            return reject(new Error(error ? error : "Username/Password Incorrect"));
                        }
                        resolve(true);
                    });
                }).catch(reject);
            } catch (e) { reject(e); }
        });
    }
    download = () => {
        const self = this;
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            if (!self.schoolID || self.schoolID.trim()==="") return reject(new Error('School ID required'));
            self.client.get(`https://apps.edustar.vic.edu.au/edustarmc/api/MC/GetStudents/${self.schoolID}/FULL`)
            .then((res)=>{
                if (!res || !res.data || typeof(res.data) !== "object") return reject(new Error('No response'));
                return resolve(res.data);
            }).catch(e=>{
                if (e.response.data.Message&&String(e.response.data.Message).includes("Object reference")) return reject("Incorrect School ID");
                reject("Download Failed");
            });
        });
    }
    getUsers = async (useCache = true) => {
        const self = this;
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                let cache = false;
                if (fs.existsSync(eduSTARCache)) cache = JSON.parse(fs.readFileSync(eduSTARCache));
                if ( !cache || (cache && useCache && ((((new Date()) - new Date(cache.date))/1000/60/60) >= (self.cachePolicy))) ) {
                    const data = await this.download();
                    cache = { date: new Date(), user: this.Username, data }
                    fs.writeFileSync(eduSTARCache, JSON.stringify(cache));
                } self.users = cache.data;
                resolve(cache);
            } catch (e) { reject(e); }
        });
    }
    getMatches = async (eduHUB=[], useCache) => {
        if (!this.users) await this.getUsers(useCache);
        const eduSTAR_matches = {};
        const eduHUB_matches = {};
        const matches = {};
        const conflicts = [];
        for (const hubRow in eduHUB) {
            try{
            const hubUser = eduHUB[hubRow];
            if (["LEFT","LVNG","DEL"].includes(hubUser.STATUS)) continue;
            const possible_matches = {};
            for (const starRow in this.users) {
                try{
                    const starUser = this.users[starRow];
                    let hits = 0;
                    const hubDISPLAY_NAME = `${hubUser.PREF_NAME} ${hubUser.SURNAME}`;
                    if (starUser._displayName===hubDISPLAY_NAME) hits++;
                    if (starUser._displayName.trim().toLowerCase()===hubDISPLAY_NAME.trim().toLowerCase()) hits++;
                    if (starUser._firstName===hubUser.FIRST_NAME) hits++;
                    if (starUser._firstName===hubUser.PREF_NAME) hits++;
                    if (starUser._firstName.trim().toLowerCase()===hubUser.PREF_NAME.trim().toLowerCase()) hits++;
                    if (starUser._firstName.trim().toLowerCase()===hubUser.FIRST_NAME.trim().toLowerCase()) hits++;
                    if (starUser._lastName===hubUser.SURNAME) hits++;
                    if (starUser._lastName.trim().toLowerCase()===hubUser.SURNAME.trim().toLowerCase()) hits++;
                    if (starUser._desc===hubUser.SCHOOL_YEAR) hits++;
                    if (starUser._class.trim().toLowerCase()===hubUser.HOME_GROUP.trim().toLowerCase()) hits++;
                    if (starUser._login.trim().toLowerCase()[0]===hubUser.FIRST_NAME.trim().toLowerCase()[0]) hits++;
                    if (starUser._login.trim().toLowerCase().slice(-3)===hubUser.SURNAME.trim().toLowerCase().slice(0, 3)) hits++;
                    if (hubUser.STATUS==="ACTV") hits++;
                    if (!starUser._disabled) hits++;
                    if (hits<=0) continue;
                    possible_matches[starUser._login] = {hits, starUser, hubUser};
                } catch(e) { continue; }
            }
            if (Object.keys(possible_matches).length <=0) continue;
            let best_match = {key: Object.keys(possible_matches)[0], hits: possible_matches[Object.keys(possible_matches)[0]].hits, match: possible_matches[Object.keys(possible_matches)[0]]  };
            for (const key in possible_matches) {
                const match = possible_matches[key];
                if (match.hits > best_match.hits) best_match = {key, hits: match.hits, match};
            }
            if (eduSTAR_matches[best_match.key]){
                if (best_match.hits < eduSTAR_matches[best_match.key].hits){
                    continue;
                }
                if (best_match.hits == eduSTAR_matches[best_match.key].hits){
                    if (best_match.match.hubUser.STATUS!=="ACTV") continue;
                    conflicts.push(hubUser.STKEY);
                    continue;
                }
            }
            eduHUB_matches[hubUser.STKEY] = best_match;
            matches[hubUser.STKEY] = best_match.match.starUser;
            eduSTAR_matches[best_match.key] = {key: hubUser.STKEY, hits: best_match.hits, match: best_match.match};
            } catch(e) { continue; }
        }
        this.matches = matches;
        return matches;
    }
    update = (passwords=[]) => {
        const self = this;
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            if (!self.schoolID || self.schoolID.trim()==="") return reject(new Error('School ID required'));
            if (passwords.length<=0) return reject(new Error('No passwords given to reset'));
            const data = {
                "_schoolId" : self.schoolID,
                "_rows" : passwords
            }
            self.client.post(`https://apps.edustar.vic.edu.au/edustarmc/api/MC/BulkSetPasswordCSV`, data)
            .then((res)=>{
                if (!res || !res.data || typeof(res.data) !== "object") return reject(new Error('No response'));
                const results = res.data;
                if (results.length <=0) return reject(new Error('Invalid response'));
                const errors = results.filter(r=>r._outcome!=="OK");
                if (errors.length >= 1) return reject(new Error(`Error setting passwords: ${JSON.stringify(errors)}`));
                return resolve(res.data);
            }).catch(e=>{
                if (e.response.data.Message&&String(e.response.data.Message).includes("Object reference")) return reject("Incorrect School ID");
                reject("Password resets failed");
            });
        });
    }
}

