import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../actions.js";

interface SysTemplate {
    templates: { key: string; value: string; }[];
    [k: string]: unknown;
}

export default async function SysTemplate({ action, template, data }: props<SysTemplate>, copy = false) {
    try {
        for (const t of action.templates||[]) {
            const key = compile(template, t.key);
            if (!key) throw new xError("Key not provided.");
            const value = compile(template, t.value||"");
            data[key] = value;
            template[key] = value as unknown as {[header: string]: string};
        }
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
