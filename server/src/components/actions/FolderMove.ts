import { Action, result, template } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import fs from 'fs-extra'
interface MoveFolder extends Action {
    source: string;
    target: string;
    validate: boolean;
    overwrite: boolean;
}
export default async function moveFolder(execute = false, act: Action, template: template): Promise <result> {
    const action = act as MoveFolder;
    const data: {[k: string]: string} = {};
    try {
        data.source = Handlebars.compile(action.source)(template);
        data.target = Handlebars.compile(action.target)(template);
        data.overwrite = String(action.overwrite);
        if (action.validate) if (!fs.existsSync(data.source)) return {warning: `Source path does not exist.`, data};
        if (!execute) return {data};
        const options = {
            overwrite: action.overwrite || false
        }
        fs.moveSync(data.source, data.target, options);
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
