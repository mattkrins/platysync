import { compile } from "../../modules/handlebars.js";
import { Action } from "../../typings/common.js";
import { actionProps } from "../engine.js";
import * as fs from 'fs';
import { moveFileSync } from 'move-file';

interface props extends actionProps {
    action: Action & {
        source: string;
        target: string;
        validate: boolean;
        overwrite: boolean;
    }
}

export default async function ({ action, template, execute, data }: props) {
    try {
        data.source = compile(template, action.source);
        data.target = compile(template, action.target);
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
