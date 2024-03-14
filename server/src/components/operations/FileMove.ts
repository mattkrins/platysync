import { compile } from "../../modules/handlebars.js";
import { Action } from "../../typings/common.js";
import { actionProps, empty } from "../engine.js";
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
        if (empty(data.source)) throw Error("No source provided.");
        data.target = compile(template, action.target);
        if (empty(data.target)) throw Error("No target provided.");
        data.overwrite = String(action.overwrite||false);
        if (action.validate) if (!fs.existsSync(data.source)) throw Error("Target path does not exist.");
        if (!execute) return { data };
        const options = {
            overwrite: action.overwrite || false
        }
        moveFileSync(data.source, data.target, options);
        return { success: true, data };
    } catch (e){
        return { error: String(e), data };
    }
}
