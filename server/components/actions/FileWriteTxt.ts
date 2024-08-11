import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import { props } from "../actions.js";

interface FileWriteTxt {
    target: string;
    data: string;
    newline?: boolean;
    validate?: boolean;
    overwrite?: boolean;
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

export default async function FileWriteTxt({ action, template, execute, data, handles }: props<FileWriteTxt>) {
    try {
        data.target = compile(template, action.target);
        data.data = compile(template, action.data||"");
        data.overwrite = String(action.overwrite||false);
        data.validate = String(action.validate||false);
        if (!data.target) throw new xError("No target provided.");
        if (action.validate) if (!fs.existsSync(data.target)) throw new xError("Target path does not exist.");
        if (!execute) return { data };
        if (!handles[data.target]) {
            if (action.overwrite && fs.existsSync(data.target)) fs.removeSync(data.target);
            const handle = await openStream(data.target);
            handles[data.target] = { handle, close: () => closeStream(handle) };
        } else {
            await handles[data.target].close();
            if (action.overwrite && fs.existsSync(data.target)) fs.removeSync(data.target);
            const handle = await openStream(data.target);
            handles[data.target] = { handle, close: () => closeStream(handle) };
        }
        (handles[data.target].handle as fs.WriteStream).write(data.data+(action.newline?"\r\n":''));
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
