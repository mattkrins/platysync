import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import { props } from "../operations.js";
import Operation from "../operation.js";

export default class FileDelete extends Operation {
    target!: string;
    validate?: boolean;
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        super.execute({ action, template, execute, data, ...rest });
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
}