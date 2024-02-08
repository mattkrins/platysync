import { compile } from "../../modules/handlebars.js";
import { Action } from "../../typings/common.js";
import { actionProps } from "../engine.js";
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
        if (action.validate) if (!fs.existsSync(data.target)) return {warning: `Target path does not exist.`, data};
        if (!execute) return {data};
        if (fs.existsSync(data.target)) fs.removeSync(data.target);
        return {success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
