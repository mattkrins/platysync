import { Action, result, template } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import pdfPrinter from "pdf-to-printer";
const { print } = pdfPrinter;
import { server } from "../../server.js";
import * as fs from 'fs';

interface SendToPrinter extends Action {
    source: string;
    target: string;
    validate: boolean;
}
//TODO - add print jobs to database for reprinting and tracking.
export default async function sendToPrinter(execute = false, act: Action, template: template): Promise <result> {
    const action = act as SendToPrinter;
    const data: {[k: string]: string} = {};
    try {
        data.source = Handlebars.compile(action.source)(template);
        data.target = action.target;
        if (action.validate) if (!fs.existsSync(data.source)) return {warning: `Souce path does not exist.`, data};
        if (!execute) return {data};
        let options = {};
        if (data.target!=="System Default"&&data.target!=="") options = { printer: data.target };
        server.io.emit("job_status", `Printing ${data.source}`);
        await print(data.source, options);
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
