import { Action, result, template } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import * as fs from 'fs';

interface DeleteFile extends Action {
    target: string;
    validate: boolean;
}
export default async function deleteFile(execute = false, act: Action, template: template): Promise <result> {
    const action = act as DeleteFile;
    const data: {[k: string]: string} = {};
    try {
        data.target = Handlebars.compile(action.target)(template);
        if (action.validate) if (!fs.existsSync(data.target)) return {warning: `Target path does not exist.`, data};
        if (!execute) return {data};
        fs.unlinkSync(data.target);
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
