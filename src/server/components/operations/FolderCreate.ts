import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import { props } from "../operations.js";
import Operation from "../operation.js";

export default class FolderCreate extends Operation {
    target!: string;
    overwrite?: boolean;
    recursive?: boolean;
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        await super.execute({ action, template, execute, data, ...rest });
        try {
            data.target = compile(template, action.target);
            data.overwrite = String(action.overwrite||false);
            data.recursive = String(action.recursive||false);
            if (!data.target) throw new xError("No target provided.");
            if (fs.existsSync(data.target)) return { warn: `Target already exists.`, data };
            if (!execute) return { data };
            fs.mkdirSync(data.target, { recursive: action.recursive });
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}
