import { Action, result, template } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import { connections } from "../rules.js";
import * as fs from 'fs';
import eduSTAR from '../../modules/eduSTAR.js';
import { CSV } from '../providers.js';

interface StmcUpload extends Action {
    source: string;
    target: string;
    validate: boolean;
}

export default async function stmcUpload(execute = false, act: Action, template: template, connections: connections): Promise <result> {
    const action = act as StmcUpload;
    const data: {[k: string]: string} = {};
    try {
        data.source = Handlebars.compile(action.source)(template);
        if (action.validate) if (!fs.existsSync(data.source)) return {warning: `Source path does not exist.`, data};
        if (!(action.target in connections)) return {error: 'Connector not found.', data};
        const client = connections[action.target].client as eduSTAR;
        const csv = new CSV(data.source);
        //TODO - validate headers
        const source = await csv.open() as { data: {[k: string]: string}[] };
        if (!execute) return {data};
        //await client.upload();
        
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
