import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import { props } from "../actions.js";

interface SysWriteCSV {
    target: string;
    filter_errors: boolean;
    filter_warnings: boolean;
}

export default async function SysWriteCSV({ action, template, execute, data, engine }: props<SysWriteCSV>) {
    try {
        data.target = compile(template, action.target);
        data.filter_errors = String(action.filter_errors||false);
        data.filter_warnings = String(action.filter_warnings||false);
        if (!data.target) throw new xError("No target provided.");
        if (!execute) return { data };
        let csv = `${engine.getRule().idName||"ID"},` + engine.getColumns().join(',');
        for (const result of engine.getPrimaryResults()) {
            if (action.filter_errors && result.error) continue;
            if (action.filter_warnings && result.warn) continue;
            csv += '\n' +  `${result.id},${result.columns.map(c=>c.value).join(",")}`;
        }
        fs.writeFileSync(data.target, csv, { encoding: "utf8", flag: "w" });
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
