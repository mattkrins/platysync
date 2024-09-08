import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../actions.js";
import STMC from "../providers/STMC.js";
import fs from 'fs-extra';
import Papa, { ParseResult } from "papaparse";

interface StmcUpStuPassBulk {
    connector: string;
    source: string;
    validate?: boolean;
}

async function open(path: string, encoding = 'utf8'): Promise<ParseResult<unknown>> {
    return new Promise((resolve, reject) => {
        try {
            const file = fs.createReadStream(path, encoding as BufferEncoding);
            Papa.parse(file, {
                header: true,
                complete: (result: Papa.ParseResult<unknown> | PromiseLike<Papa.ParseResult<unknown>>) => {
                    file.close();
                    return resolve(result);
                },
                error: (reason?: unknown) => {
                    file.close();
                    return reject(reason);
                }
            });
        } catch (e) { reject(e); }
    });
}

export default async function StmcUpStuPassBulk({ action, template, execute, data, connections, contexts, engine }: props<StmcUpStuPassBulk>) {
    try {
        data.connector = String(action.connector);
        data.source = compile(template, action.source);
        if (!data.connector) throw new xError("Connector not provided.");
        if (!data.source) throw new xError("No source provided.");
        if (action.validate) if (!fs.existsSync(data.source)) throw new xError("Source path does not exist.");
        let stmc = connections[data.connector] as STMC|undefined;
        if (!stmc) stmc = contexts[data.connector] as STMC|undefined;
        if (!stmc || !stmc.client) throw new xError(`Provider '${data.connector}' not connected.`);
        const source = await open(data.source);
        if (!source.data || source.data.length<=0) throw new xError('No rows found.');
        if (source.meta.delimiter !== ",") throw new xError('Invalid delimiter.');
        if (!source.meta.fields || source.meta.fields.length<2) throw new xError('Missing headers.');
        if (source.meta.fields[0] !== "login") throw new xError('Header 1 invalid.');
        if (source.meta.fields[1] !== "password") throw new xError('Header 2 invalid.');
        if (!execute) return { data };
        const csv = source.data as {login: string, password: string}[];
        const payload = csv.map(row=>({ _login:row.login, _pass: row.password }));
        if (payload.length<=0) throw new xError('Payload empty.');
        engine.Emit({ text: `Uploading ${payload.length} rows to STMC` });
        await stmc.client.setStudentPasswords(payload);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
