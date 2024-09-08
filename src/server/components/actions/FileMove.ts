import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import { props } from "../actions.js";
import { moveFileSync } from 'move-file';

interface FileMove {
    source: string;
    target: string;
    validate?: boolean;
    overwrite?: boolean;
}

export type FileMoveProps = props<FileMove>;

export default async function FileMove({ action, template, execute, data }: props<FileMove>, copy = false) {
    try {
        data.source = compile(template, action.source);
        data.target = compile(template, action.target);
        data.overwrite = String(action.overwrite||false);
        data.validate = String(action.validate||false);
        if (!data.source) throw new xError("No source provided.");
        if (!data.target) throw new xError("No target provided.");
        if (action.validate) if (!fs.existsSync(data.source)) throw new xError("Source path does not exist.");
        if (!execute) return { data };
        if (copy) {
            fs.copyFileSync(data.source, data.target, action.overwrite ? undefined : fs.constants.COPYFILE_EXCL ); 
        } else {
            moveFileSync(data.source, data.target, { overwrite: action.overwrite || false });
        }
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
