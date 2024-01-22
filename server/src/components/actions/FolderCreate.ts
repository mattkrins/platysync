import { Action, result, template } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import * as fs from 'fs';

interface FolderCreate extends Action {
    target: string;
    recursive: boolean;
}
export default async function folderCreate(execute = false, act: Action, template: template): Promise <result> {
    const action = act as FolderCreate;
    const data: {[k: string]: string} = {};
    try {
        data.recursive = String(action.recursive);
        data.target = Handlebars.compile(action.target)(template);
        if (!execute) return {data};
        if (!fs.existsSync(data.target)) fs.mkdirSync(data.target, { recursive: action.recursive });
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
