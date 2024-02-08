import { Action, Condition } from "../../typings/common.js";
import { actionProps, evaluateAll } from "../engine.js";

interface props extends actionProps {
    action: Action & {
        conditions: Condition[];
        target: string;
        output: boolean;
    }
}

export default async function ({ action, template, connections }: props) {
    try {
        const matched = !await evaluateAll(action.conditions, template, connections );
        const newTemplate: { [k:string]: string } = {};
        const output = action.output ? Handlebars.compile(action.target)(template) : false;
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
