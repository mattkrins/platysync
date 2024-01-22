import { Action, result, template } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import { connections } from "../rules.js";
import * as fs from 'fs';
import eduSTAR, { passwordPayload } from '../../modules/eduSTAR.js';
import { CSV } from '../providers.js';
import { server } from '../../server.js';

interface StmcUpload extends Action {
    source: string;
    target: string;
    validate: boolean;
    nohead: boolean;
}

export default async function stmcUpload(execute = false, act: Action, template: template, connections: connections): Promise <result> {
    const action = act as StmcUpload;
    const data: {[k: string]: string} = {};
    try {
        data.source = Handlebars.compile(action.source)(template);
        if (action.validate) if (!fs.existsSync(data.source)) return {error: `Source path does not exist.`, data};
        if (!(action.target in connections)) return {error: 'Connector not found.', data};
        const client = connections[action.target].client as eduSTAR;
        const csv = new CSV(data.source);
        const source = await csv.open(action.nohead?false:true);
        if (!source.data || source.data.length<=0) return {error: 'No rows found.', data};
        if (source.meta.delimiter !== ",") return {error: 'Invalid delimiter.', data};
        if (action.validate || execute) {
            if (action.nohead) {
                const r0 = source.data[0] as [string, string];
                if (!r0[0]) return {error: `Missing header 1.`, data};
                if (!r0[1]) return {error: `Missing header 2.`, data};
                if (r0[0] === "login" || r0[1] === "password") return {warning: `Headers detected.`, data};
            } else {
                if (!source.meta.fields || source.meta.fields.length<2) return {error: `Missing headers.`, data};
                if (source.meta.fields[0] !== "login") return {error: `Header 1 invalid.`, data};
                if (source.meta.fields[1] !== "password") return {error: `Header 2 invalid.`, data};
            }
        }
        if (!execute) return {data};
        const payload: passwordPayload = [];
        if (action.nohead) {
            const rows = source.data as [string, string][];
            for (const r of rows) payload.push({ _login:r[0], _pass: r[1] });
        } else {
            const rows = source.data as {login: string, password: string}[];
            for (const r of rows) payload.push({ _login:r.login, _pass: r.password });
        }
        if (payload.length<=0) return {error: 'Payload empty.', data};
        server.io.emit("job_status", `Uploading ${payload.length} rows to STMC`);
        await client.upload(payload);
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
