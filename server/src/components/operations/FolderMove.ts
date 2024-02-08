import { compile } from "../../modules/handlebars.js";
import { Action } from "../../typings/common.js";
import { actionProps } from "../engine.js";
import fs from 'fs-extra';

export interface props extends actionProps {
    action: Action & {
        source: string;
        target: string;
        validate: boolean;
        overwrite: boolean;
    }
}

export default async function ({ action, template, execute, data }: props, copy = false) {
    try {
        data.source = compile(template, action.source);
        data.target = compile(template, action.target);
        data.overwrite = String(action.overwrite);
        if (action.validate) if (!fs.existsSync(data.source)) return {warning: `Source path does not exist.`, data};
        if (!execute) return {data};
        const options = {
            overwrite: action.overwrite || false
        }
        if (copy) {
            fs.copySync(data.source, data.target, options);
        } else {
            fs.moveSync(data.source, data.target, options)
        }
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
