import { Action, result, template } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import { FileHandles, connections } from "../rules.js";
import * as fs from 'fs';

interface FileWriteTxt extends Action {
    target: string;
    data: string;
    validate: boolean;
    newline: boolean;
}

function openStream(path: string): Promise<fs.WriteStream> {
    return new Promise((resolve, reject) => {
        const a = fs.createWriteStream(path, {flags:'a'});
        a.on('error', reject);
        resolve(a);
    });
}

function closeStream(stream: fs.WriteStream): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!stream) return resolve();
        stream.close((e)=>e?reject(e):resolve());
    });
}

export default async function fileWriteTxt(
    execute = false,
    act: Action,
    template: template,
    _connections: connections,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fileHandles: FileHandles,
    close?: boolean,
): Promise <result> {
    const action = act as FileWriteTxt;
    const data: {[k: string]: string} = {};
    try {
        data.target = Handlebars.compile(action.target)(template);
        data.data = Handlebars.compile(action.data)(template);
        if (action.validate) if (!fs.existsSync(data.target)) return {warning: `Target path does not exist.`, data};
        if (!execute) return {data};
        if (!fileHandles[action.target]) fileHandles[action.target] = {type: 'fileStream', handle: await openStream(data.target)};
        fileHandles[action.target].handle.write(data.data+(action.newline?"\r\n":''));
        if (close && fileHandles[action.target]){
            await closeStream(fileHandles[action.target].handle);
            delete fileHandles[action.target];
        }
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
