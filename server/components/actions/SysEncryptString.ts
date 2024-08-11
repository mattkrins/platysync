import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../actions.js";
import { Encrypt } from "../../modules/cryptography.js";

interface SysEncryptString {
    secret: string;
    password: string;
    strength?: number;
    key?: string;
}

function ensureMinimumValue(value: number | string): number {
    const numericValue: number = typeof value === 'string' ? parseInt(value, 10) : value;
    return Math.max(numericValue, 100);
}

export default async function SysEncryptString({ action, template, data }: props<SysEncryptString>) {
    try {
        data.secret = compile(template, action.secret);
        data.password = compile(template, action.password);
        data.key = compile(template, action.key, "result");
        if (!data.secret) throw new xError("No secret provided.");
        if (!data.password) throw new xError("No encryption key provided.");
        data.strength = String(action.strength||"1000");
        const strength = ensureMinimumValue(data.strength);
        const encrypted = await Encrypt(data.secret, data.password, strength);
        template[data.key] = JSON.stringify(encrypted) as unknown as {[header: string]: string};
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
