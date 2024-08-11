import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import path from 'path';
import { props } from "../actions.js";
import winPrinter from "pdf-to-printer";
import unixPrinter from "unix-print";

interface DocPrintPDF {
    source: string;
    target?: string;
    validate?: boolean;
}

const isWin = process.platform === "win32";

export default async function DocPrintPDF({ action, template, execute, engine, data }: props<DocPrintPDF>) {
    try {
        data.source = compile(template, action.source);
        data.target = compile(template, action.target);
        data.validate = String(action.validate||false);
        if (!data.source) throw new xError("No source provided.");
        if (!data.target) throw new xError("No target provided.");
        if (action.validate) if (!fs.existsSync(data.source)) throw new xError("Target path does not exist.");
        if (!execute) return { data };
        const filename = path.parse(data.source).base;
        engine.Emit({ text: `Printing ${filename}` });
        if (isWin) {
            const options: { printer?: string } = {};
            if (data.target&&data.target!=="System Default") options.printer = data.target;
            await winPrinter.print(data.source, options);
        } else {
            await unixPrinter.print(data.source, data.target);
        }
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
