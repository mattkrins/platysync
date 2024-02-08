import { compile } from "../../modules/handlebars.js";
import { Action } from "../../typings/common.js";
import { actionProps } from "../engine.js";
import * as fs from 'fs';

interface props extends actionProps {
    action: Action & {
        target: string;
        recursive: boolean;
    }
}

export default async function ({ action, template, execute, data }: props) {
    try {
        data.target = compile(template, action.target);
        data.recursive = String(action.recursive);
        if (!execute) return {data};
        if (!fs.existsSync(data.target)) fs.mkdirSync(data.target, { recursive: action.recursive });
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
