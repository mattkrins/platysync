import * as fs from 'node:fs';
import { paths } from "../../index.js";
import { decrypt, encrypt } from "./cryptography.js";
import eduSTAR, { student } from 'edustar-sdk';

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

export default class eduSTARStmc {
    public client: eduSTAR;
    public school: string;
    private cachePolicy: number = 1440;
    private includeInactive: boolean;
    private students: student[] = [];
    public alert?: (status: string) => unknown;
    constructor(options: Options) {
        this.school = options.school;
        this.cachePolicy = options.cache || 1440;
        this.includeInactive = options.includeInactive || false;
        this.client = new eduSTAR();
    }
    public async login(username: string, password: string): Promise<void> {
        await this.client.login(username, password);
    }
    public async getStudents(): Promise<student[]> {
        if (this.students && this.students.length > 0) return this.students;
        if (!fs.existsSync(`${paths.cache}/STMC.${this.school}.students.json`)) return await this.downloadStudents();
        const file: string = fs.readFileSync(`${paths.cache}/STMC.${this.school}.students.json`, 'utf8');
        const cache = JSON.parse(file) as cache;
        if ((((new Date().valueOf()) - new Date(cache.date).valueOf())/1000/60) >= (this.cachePolicy)) return await this.downloadStudents();
        const students = JSON.parse(await decrypt(cache.data as Hash)) as student[];
        this.students = students;
        return students;
    }
    private async downloadStudents(): Promise<student[]> {
        try {
            if (this.alert) this.alert('Downloading students...');
            const data = await this.client.getStudents(this.school);
            const encrypted = await encrypt(JSON.stringify(data));
            const cache: cache = { date: new Date(), data: encrypted };
            fs.writeFileSync(`${paths.cache}/STMC.${this.school}.students.json`, JSON.stringify(cache));
            return data;
        } catch (e) {
            const { message } = e as { response: {status: number}, message: string };
            if (message.includes("Object reference")) throw Error("Incorrect School ID.");
            throw Error(message);
        }
    }
    public async setStudentPassword(dn: string, newPass: string): Promise<true> {
        try {
            await this.client.setStudentPassword(this.school, dn, newPass);
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
    public async setStudentPasswords(payload: passwordPayload): Promise<void> {
        try {
            const results = await this.client.setStudentPasswords(this.school, payload);
            if (results.length <= 0) throw Error("Invalid response.");
            const errors = results.filter(r=>r._outcome!=="OK");
            if (errors.length > 0) throw new Error(`Error setting passwords: ${JSON.stringify(errors)}`);
        } catch (e) {
            const { message : defMess, response } = e as { response: { status: number, data?: { Message?: string  } }, message: string };
            const message = response.data?.Message||defMess;
            if (message.includes("reference not set")) throw Error("Incorrect School ID.");
            throw Error(message);
        }
    }
    public async getStudentsMatchSTKEY(eduhub: { [k: string]: string }[]): Promise<student[]> {
        //TODO - add option to specify eduhub column and skip scoring
        if (this.alert) this.alert('Matching eduhub data...');
        const collator = new Intl.Collator(undefined, { sensitivity: "base" });
        const calculateScore = (star: student, hub: { [k: string]: string }) => {
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