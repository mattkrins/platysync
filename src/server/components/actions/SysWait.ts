import { wait, xError } from "../../modules/common.js";
import { props } from "../actions.js";

interface SysWait {
    time: number;
    evaluation: boolean;
}

export default async function SysWait({ action, execute, data }: props<SysWait>) {
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
