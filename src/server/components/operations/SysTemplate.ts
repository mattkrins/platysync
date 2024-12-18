import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import Operation from "../operation.js";
import { props } from "../operations.js";

export default class SysTemplate extends Operation {
    templates: { key: string; value: string; }[] = [];
    public async execute({ action, template, data, ...rest }: props<this>) {
        super.execute({ action, template, data, ...rest });
        try {
            for (const t of action.templates||[]) {
                const key = compile(template, t.key);
                if (!key) throw new xError("Key not provided.");
                const value = compile(template, t.value||"");
                data[key as keyof this] = value;
                template[key] = value as unknown as {[header: string]: string};
            }
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}