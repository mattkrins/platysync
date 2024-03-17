import { compile } from "../../modules/handlebars.js";
import { Action, actionProps } from "../../typings/common.js";
import { empty } from "../engine.js";

interface props extends actionProps {
    action: Action & {
        templates: { name: string; value: string; }[];
    }
}

export default async function ({ action, template, data }: props) {
    try {
        for (const t of action.templates) {
            data.name = compile(template, t.name||"");
            if (empty(data.name)) throw Error("Key not provided.");
            data.value = compile(template, t.value||"");
            template[data.name] = data.value;
        }
        return { success: true, data };
    } catch (e){
        return { error: String(e), data };
    }
}
