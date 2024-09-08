import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import { props } from "../actions.js";

interface SysComparator {
    conditions: Condition[];
    output?: boolean;
    key?: string;
    true?: string;
    false?: string;
    [k: string]: unknown;
}

export default async function SysComparator({ action, template, data, engine, id }: props<SysComparator>) {
    try {
        const matched = await engine.evaluateAll(action.conditions||[], template, id)
        const key = action.key && action.key.trim()!=='' ? compile(template, action.key||"") : 'result';
        const tru = action.true && action.true.trim()!=='' ? compile(template, action.true||"") : 'true';
        const fals = action.false && action.false.trim()!=='' ? compile(template, action.false||"") : 'false';
        data.result = String(matched);
        if (action.output){
            data.trueOutput = tru;
            data.falseOutput = fals;
            data[key] = matched ? tru : fals;
        }
        if (matched) {
            if (!action.output) return { success: true, data };
            template[key] = tru as unknown as {[header: string]: string};
        } else {
            if (!action.output) return { error: new xError('Did not meet conditions.'), data };
            template[key] = fals as unknown as {[header: string]: string};
        }
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
