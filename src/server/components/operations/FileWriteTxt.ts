import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import { props } from "../operations.js";
import Operation from "../operation.js";

export default class FileWriteTxt extends Operation {
    target!: string;
    data!: string;
    newline?: boolean;
    validate?: boolean;
    overwrite?: boolean;
    close?: boolean;
    public async execute({ action, template, execute, data, handles, ...rest }: props<this>) {
        await super.execute({ action, template, execute, data, handles, ...rest });
        try {
            data.target = compile(template, action.target);
            data.data = compile(template, action.data||"");
            data.overwrite = String(action.overwrite||false);
            data.validate = String(action.validate||false);
            data.close = String(action.close||false);
            if (!data.target) throw new xError("No target provided.");
            if (action.validate) if (!fs.existsSync(data.target)) throw new xError("Target path does not exist.");
            if (!execute) return { data };
            const flags = action.overwrite ? "w" : "a";
            if (!handles[data.target]) {
                const handle = await this.openStream(data.target, flags);
                handles[data.target] = { handle, close: () => this.closeStream(handle) };
            } else {
                await handles[data.target].close();
                const handle = await this.openStream(data.target, flags);
                handles[data.target] = { handle, close: () => this.closeStream(handle) };
            }
            await this.writeStream(handles[data.target].handle as fs.WriteStream, data.data+(action.newline?"\r\n":''));
            if (action.close && handles[data.target]) await handles[data.target].close();
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
    private openStream(path: string, flags = "a"): Promise<fs.WriteStream> {
        return new Promise((resolve, reject) => {
            const a = fs.createWriteStream(path, {flags});
            a.on('error', reject);
            resolve(a);
        });
    }
    private closeStream(stream: fs.WriteStream): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!stream) return resolve();
            stream.close(e=>e?reject(e):resolve());
        });
    }
    private writeStream(stream: fs.WriteStream, data: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!stream) return resolve();
            stream.write(data,e=>e?reject(e):resolve());
        });
    }
    
}