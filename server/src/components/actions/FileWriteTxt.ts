import { Action, result, template } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import { connections } from "../rules.js";
import * as fs from 'fs';

interface FileWriteTxt extends Action {
    target: string;
    data: string;
    validate: boolean;
    newline: boolean;
}

export default async function fileWriteTxt(
    execute = false,
    act: Action,
    template: template,
    _connections: connections,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fileHandles: {[handle: string]: any}
): Promise <result> {
    const action = act as FileWriteTxt;
    const data: {[k: string]: string} = {};
    try {
        data.target = Handlebars.compile(action.target)(template);
        if (action.validate) if (!fs.existsSync(data.target)) return {warning: `Target path does not exist.`, data};
        if (!fileHandles[action.target]) fileHandles[action.target] = fs.createWriteStream(data.target, {flags:'a'});
        data.data = Handlebars.compile(action.data)(template);
        if (!execute) return {data};
        fileHandles[action.target].write(data.data+(action.newline?"\r\n":''));
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
