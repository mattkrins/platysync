import { Action, result, template } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import fs from 'fs-extra'

interface DeleteFolder extends Action {
    target: string;
    validate: boolean;
}
export default async function deleteFolder(execute = false, act: Action, template: template): Promise <result> {
    const action = act as DeleteFolder;
    const data: {[k: string]: string} = {};
    try {
        data.target = Handlebars.compile(action.target)(template);
        if (action.validate) if (!fs.existsSync(data.target)) return {warning: `Target path does not exist.`, data};
        if (!execute) return {data};
        if (fs.existsSync(data.target)) fs.removeSync(data.target);
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
