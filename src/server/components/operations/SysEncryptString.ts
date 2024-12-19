import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../operations.js";
import { Encrypt } from "../../modules/cryptography.js";
import Operation from "../operation.js";

export function ensureMinimumValue(value: number | string): number {
    const numericValue: number = typeof value === 'string' ? parseInt(value, 10) : value;
    return Math.max(numericValue, 100);
}

export default class SysEncryptString extends Operation {
    secret!: string;
    password!: string;
    strength?: number;
    key?: string;
    encrypted?: string;
    public async execute({ action, template, data, ...rest }: props<this>) {
        await super.execute({ action, template, data, ...rest });
        try {
            data.secret = compile(template, action.secret);
            data.password = compile(template, action.password);
            data.key = compile(template, action.key, "result");
            if (!data.secret) throw new xError("No secret provided.");
            if (!data.password) throw new xError("No encryption key provided.");
            data.strength = String(action.strength||"1000");
            const strength = ensureMinimumValue(data.strength);
            const encrypted = await Encrypt(data.secret, data.password, strength);
            data.encrypted = JSON.stringify(encrypted);
            template[data.key] = data.encrypted as unknown as {[header: string]: string};
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}
