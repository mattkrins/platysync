import { wait, xError } from "../../modules/common.js";
import Operation from "../operation.js";
import { props } from "../operations.js";

export default class SysWait extends Operation {
    time: number = 1000;
    evaluation: boolean = false;
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        await super.execute({ action, template, execute, data, ...rest });
        try {
            data.time = `${action.time||1000}ms`;
            if (action.evaluation) await wait(action.time||1000);
            if (!execute) return { data };
            if (!action.evaluation) await wait(action.time||1000);
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}