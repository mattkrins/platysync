import { Action, Condition } from "../../typings/common.js";
import { actionProps, evaluateAll } from "../engine.js";
import { compile } from "../../modules/handlebars.js";

interface props extends actionProps {
    action: Action & {
        conditions: Condition[];
        target: string;
        output: boolean;
    }
}

export default async function ({ action, template, connections, id }: props) {
    try {
        const matched = !await evaluateAll(action.conditions, template, connections, id );
        const newTemplate: { [k:string]: string } = {};
        const output = action.output ? compile(template, action.target||"") : false;
        if (!matched) {
            if (output===false) return { success: true };
            newTemplate[output] = 'true';
        } else {
            if (output===false) return {error: 'Did not meet conditions.'};
            newTemplate[output] = 'false';
        }
        return {template: true, data: newTemplate};
    } catch (e){
        return {error: String(e)};
    }
}
