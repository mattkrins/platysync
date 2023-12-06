import Handlebars from "../../modules/handlebars.js";
import pdfPrinter from "pdf-to-printer";
const { print } = pdfPrinter;
import { server } from "../../server.js";
import * as fs from 'fs';
//TODO - add print jobs to database for reprinting and tracking.
export default async function sendToPrinter(execute = false, act, template) {
    const action = act;
    const data = {};
    try {
        data.source = Handlebars.compile(action.source)(template);
        data.target = action.target;
        if (action.validate)
            if (!fs.existsSync(data.source))
                return { warning: `Souce path does not exist.`, data };
        if (!execute)
            return { data };
        let options = {};
        if (data.target !== "System Default" && data.target !== "")
            options = { printer: data.target };
        server.io.emit("job_status", `Printing ${data.source}`);
        await print(data.source, options);
        return { success: true, data };
    }
    catch (e) {
        return { error: String(e), data };
    }
}
