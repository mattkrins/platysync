import { Action, Condition } from "../../typings/common.js";
import { actionProps, evaluateAll } from "../engine.js";
import { compile } from "../../modules/handlebars.js";

interface props extends actionProps {
    action: Action & {
        conditions: Condition[];
        target: string;
        output: boolean;
        true: string;
        false: string;
    }
}

export default async function ({ action, template, data, connections, id }: props) {
    try {
        const matched = await evaluateAll(action.conditions, template, connections, id );
        const key = action.target && action.target.trim()!=='' ? compile(template, action.target||"") : 'result';
        const tru = action.true && action.true.trim()!=='' ? compile(template, action.true||"") : 'true';
        const fals = action.false && action.false.trim()!=='' ? compile(template, action.false||"") : 'false';
        data.result = String(matched);
        if (action.output){
            data.trueOutput = tru;
            data.falseOutput = fals;
            data[key] = matched ? tru : fals;
        }
        if (matched) {
            if (action.output===false) return { success: true, data };
            template[key] = tru;
        } else {
            if (action.output===false) return { error: 'Did not meet conditions.', data };
            template[key] = fals;
        }
        return { success: true, data };
    } catch (e){
        return { error: String(e) };
    }
}
