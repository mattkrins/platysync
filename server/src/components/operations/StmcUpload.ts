import { compile } from "../../modules/handlebars.js";
import { Action, actionProps } from "../../typings/common.js";
import { CSV } from '../providers.js';
import { server } from '../../server.js';
import { ParseResult } from 'papaparse';
import eduSTAR, { passwordPayload } from '../../modules/eduSTAR.js';
import { xError } from "../../modules/common.js";

interface props extends actionProps {
    action: Action & {
        source: string;
        target: string;
        validate: boolean;
        nohead: boolean;
    }
}

export default async function ({ action, template, execute, data, connections }: props) {
    try {
        data.source = compile(template, action.source);
        let client: eduSTAR|undefined = undefined;
        let source: ParseResult<unknown>|undefined = undefined;
        if (action.validate || execute){
            client = connections[action.target].client as eduSTAR;
            const csv = new CSV({path: data.source, id: '', name: ''});
            await csv.validate();
            source = await csv.open(action.nohead?false:true);
            if (!source.data || source.data.length<=0) throw new xError('No rows found.');
            if (source.meta.delimiter !== ",") throw new xError('Invalid delimiter.');
            if (action.nohead) {
                const r0 = source.data[0] as [string, string];
                if (!r0[0]) throw new xError('Missing header 1.');
                if (!r0[1]) throw new xError('Missing header 2.');
                if (r0[0] === "login" || r0[1] === "password") return { warning: `Headers detected.`, data };
            } else {
                if (!source.meta.fields || source.meta.fields.length<2) throw new xError('Missing headers.');
                if (source.meta.fields[0] !== "login") throw new xError('Header 1 invalid.');
                if (source.meta.fields[1] !== "password") throw new xError('Header 2 invalid.');
            }
        }
        if (!execute) return { data };
        if (!source) throw new xError('No source.');
        if (!client) throw new xError('No client.');
        const payload: passwordPayload = [];
        if (action.nohead) {
            const rows = source.data as [string, string][];
            for (const r of rows) payload.push({ _login:r[0], _pass: r[1] });
        } else {
            const rows = source.data as {login: string, password: string}[];
            for (const r of rows) payload.push({ _login:r.login, _pass: r.password });
        }
        if (payload.length<=0) throw new xError('Payload empty.');
        server.io.emit("job_status", `Uploading ${payload.length} rows to STMC`);
        await client.upload(payload);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}