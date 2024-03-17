import { compile } from "../../modules/handlebars.js";
import { Action, actionProps } from "../../typings/common.js";
import { empty } from "../engine.js";
import * as fs from 'fs';

interface props extends actionProps {
    action: Action & {
        target: string;
        data: string;
        validate: boolean;
        newline: boolean;
    }
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

export default async function ({ action, template, execute, data, connections }: props) {
    try {
        data.target = compile(template, action.target);
        if (empty(data.target)) throw Error("No target provided.");
        data.data = compile(template, action.data||"");
        if (action.validate) if (!fs.existsSync(data.target)) throw Error("Target path does not exist.");
        if (!execute) return { data };
        if (!connections[action.target]) {
            const client = await openStream(data.target);
            connections[action.target] = {
                rows: [], keyed: {}, client, close: async () => {
                    await closeStream(client);
                    delete connections[action.target];
                    return true;
                }
            }
        }
        (connections[action.target].client as fs.WriteStream).write(data.data+(action.newline?"\r\n":''));
        return { success: true, data, connections };
    } catch (e){
        return { error: String(e), data };
    }
}
