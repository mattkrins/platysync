import { Action, result, template } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import * as fs from 'fs';
import { moveFileSync } from 'move-file';

interface MoveFile extends Action {
    source: string;
    target: string;
    validate: boolean;
    overwrite: boolean;
}
export default async function _moveFile(execute = false, act: Action, template: template): Promise <result> {
    const action = act as MoveFile;
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
        moveFileSync(data.source, data.target, options);
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
