import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import { props } from "../actions.js";

interface FolderMove {
    source: string;
    target: string;
    validate?: boolean;
    overwrite?: boolean;
}

export type FolderMoveProps = props<FolderMove>;

export default async function FolderMove({ action, template, execute, data }: props<FolderMove>, copy = false) {
    try {
        data.source = compile(template, action.source);
        data.target = compile(template, action.target);
        data.overwrite = String(action.overwrite||false);
        data.validate = String(action.validate||false);
        if (!data.source) throw new xError("No source provided.");
        if (!data.target) throw new xError("No target provided.");
        if (action.validate) if (!fs.existsSync(data.source)) throw new xError("Source path does not exist.");
        if (!execute) return { data };
        const options = { overwrite: action.overwrite || false }
        if (copy) {
            fs.copySync(data.source, data.target, options);
        } else {
            fs.moveSync(data.source, data.target, options)
        }
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
