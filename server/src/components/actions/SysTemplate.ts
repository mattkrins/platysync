import { Action, template, result } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";

interface Template extends Action  {
    templates: { name: string; value: string; }[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function templateData(execute = false, act: Action, template: template): Promise <result> {
    const action = act as Template;
    try {
        const newTemplate: { [k:string]: string } = {};
        for (const t of action.templates) {
            const name = Handlebars.compile(t.name||"")(template);
            const value = Handlebars.compile(t.value||"")(template);
            newTemplate[name] = value;
        }
        return {template: true, data: newTemplate};
    } catch (e){
        return {error: String(e)};
    }
}
