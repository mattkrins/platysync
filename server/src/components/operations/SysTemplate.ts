import { compile } from "../../modules/handlebars.js";
import { Action } from "../../typings/common.js";
import { actionProps } from "../engine.js";

interface props extends actionProps {
    action: Action & {
        templates: { name: string; value: string; }[];
    }
}

export default async function ({ action, template, data }: props) {
    try {
        const newTemplate: { [k:string]: string } = {};
        for (const t of action.templates) {
            const name = compile(template, t.name||"");
            const value = compile(template, t.value||"");
            newTemplate[name] = value;
        }
        return {template: true, data: newTemplate};
    } catch (e){
        return {error: String(e), data};
    }
}
