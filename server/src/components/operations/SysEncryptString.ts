import { compile } from "../../modules/handlebars.js";
import { Action, actionProps } from "../../typings/common.js";
import { encryptString as encrypt } from "../../modules/cryptography.js"
import { xError } from "../../modules/common.js";

interface props extends actionProps {
    action: Action & {
        source: string;
        target: string;
        password: string;
        value: string;
    }
}

function ensureMinimumValue(value: number | string): number {
    const numericValue: number = typeof value === 'string' ? parseInt(value, 10) : value;
    return Math.max(numericValue, 100);
}

export default async function ({ action, template, data }: props) {
    try {
        data.source = compile(template, action.source);
        data.target = compile(template, action.target||"encrypted");
        data.password = compile(template, action.password);
        data.strength = action.value||"100";
        const strength = ensureMinimumValue(data.strength);
        const encrypted = await encrypt(data.source, data.password, strength);
        template[data.target] = JSON.stringify(encrypted);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
