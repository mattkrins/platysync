import { Action, result, template } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import * as fs from 'fs';
interface CopyFile extends Action {
    source: string;
    target: string;
    validate: boolean;
    overwrite: boolean;
}
export default async function copyFile(execute = false, act: Action, template: template): Promise <result> {
    const action = act as CopyFile;
    const data: {[k: string]: string} = {};
    try {
        data.source = Handlebars.compile(action.source)(template);
        data.target = Handlebars.compile(action.target)(template);
        data.overwrite = String(action.overwrite);
        if (action.validate) if (!fs.existsSync(data.source)) return {warning: `Source path does not exist.`, data};
        if (!execute) return {data};
        if (action.overwrite){
            fs.copyFileSync(data.source, data.target); 
        } else {
            fs.copyFileSync(data.source, data.target, fs.constants.COPYFILE_EXCL); 
        }
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
