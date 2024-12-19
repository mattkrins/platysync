import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import Operation from "../operation.js";
import { props } from "../operations.js";

export default class SysComparator extends Operation {
    conditions: Condition[] = [];
    output?: boolean;
    key?: string;
    true?: string;
    false?: string;
    result?: string;
    trueOutput?: string;
    falseOutput?: string;
    public async execute({ action, template, data, engine, id, ...rest }: props<this>) {
        await super.execute({ action, template, data, engine, id, ...rest });
        try {
            const matched = await engine.evaluateAll(action.conditions||[], template, id)
            const key = action.key && action.key.trim()!=='' ? compile(template, action.key||"") : 'result';
            const tru = action.true && action.true.trim()!=='' ? compile(template, action.true||"") : 'true';
            const fals = action.false && action.false.trim()!=='' ? compile(template, action.false||"") : 'false';
            data.result = String(matched);
            if (action.output){
                data.trueOutput = tru;
                data.falseOutput = fals;
                data[key as keyof this] = matched ? tru : fals;
            }
            if (matched) {
                if (!action.output) return { success: true, data };
                template[key] = tru as unknown as {[header: string]: string};
            } else {
                if (!action.output) return { error: new xError('Did not meet conditions.'), data };
                template[key] = fals as unknown as {[header: string]: string};
            }
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}