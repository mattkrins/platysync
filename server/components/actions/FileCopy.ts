import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import * as fs from 'fs';
import { actionProps } from "../actions.js";

interface props extends actionProps {
    action: Action & {
        source: string;
        target: string;
        validate: boolean;
        overwrite: boolean;
    }
}

export default async function FileCopy({ action, template, execute, data }: props) {
    try {
        data.source = compile(template, action.source);
        if (!data.source) throw new xError("No source provided.");
        data.target = compile(template, action.target);
        if (!data.target) throw new xError("No target provided.");
        data.overwrite = String(action.overwrite||false);
        if (action.validate) if (!fs.existsSync(data.source)) throw new xError("Target path does not exist.");
        if (!execute) return { data };
        if (action.overwrite){
            fs.copyFileSync(data.source, data.target); 
        } else {
            fs.copyFileSync(data.source, data.target, fs.constants.COPYFILE_EXCL); 
        }
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
