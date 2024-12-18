import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import path from 'path';
import { props } from "../operations.js";
import winPrinter from "pdf-to-printer";
import unixPrinter from "unix-print";
import { windows } from "../../../index.js";
import Operation from "../operation.js";

export default class DocPrintPDF extends Operation {
    source!: string;
    target?: string;
    validate?: boolean;
    public async execute({ action, template, execute, data, engine, ...rest }: props<this>) {
        super.execute({ action, template, execute, data, engine, ...rest });
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
            if (windows) {
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
}