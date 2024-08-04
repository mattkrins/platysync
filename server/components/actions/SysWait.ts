import { wait, xError } from "../../modules/common.js";
import { actionProps } from "../actions.js";

interface props extends actionProps {
    action: Action & {
        time: number;
        evaluation: boolean;
    }
}

export default async function SysWait({ action, execute, data }: props) {
    try {
        data.waitFor = `${action.time||1000}ms`;
        if (action.evaluation) await wait(action.time||1000);
        if (!execute) return { data };
        if (!action.evaluation) await wait(action.time||1000);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
