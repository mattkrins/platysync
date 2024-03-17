import { compile } from "../../modules/handlebars.js";
import { Action, actionProps } from "../../typings/common.js";
import { empty } from "../engine.js";
import fs from 'fs-extra';

export interface props extends actionProps {
    action: Action & {
        target: string;
        validate: boolean;
    }
}

export default async function ({ action, template, execute, data }: props) {
    try {
        data.target = compile(template, action.target);
        if (empty(data.target)) throw Error("No target provided.");
        if (action.validate) if (!fs.existsSync(data.target)) throw Error("Target path does not exist.");
        if (!execute) return { data };
        if (fs.existsSync(data.target)) fs.removeSync(data.target);
        return { success: true, data };
    } catch (e){
        return { error: String(e), data };
    }
}
