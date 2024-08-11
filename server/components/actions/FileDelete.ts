import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import { props } from "../actions.js";

interface FileDelete {
    target: string;
    validate?: boolean;
}

export type FileDeleteProps = props<FileDelete>;


export default async function FileDelete({ action, template, execute, data }: props<FileDelete>) {
    try {
        data.target = compile(template, action.target);
        data.validate = String(action.validate||false);
        if (!data.target) throw new xError("No target provided.");
        if (action.validate && !fs.existsSync(data.target)) throw new xError("Target path does not exist.");
        if (!fs.existsSync(data.target)) return { warn: `Target already removed.`, data };
        if (!execute) return { data };
        fs.removeSync(data.target);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
