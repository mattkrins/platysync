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
        for (const t of action.templates) {
            data.name = compile(template, t.name||"");
            data.value = compile(template, t.value||"");
            template[data.name] = data.value;
        }
        return {success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
