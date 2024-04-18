import { xError } from "../../modules/common.js";
import { Action, actionProps } from "../../typings/common.js";
import { getUser } from "../engine.js";

export interface props extends actionProps {
    action: Action & {
        target: string;
    }
}

export default async function ({ action, execute, data, connections, keys }: props, disable = false) {
    try {
        const user = getUser(action, connections, keys, data);
        if (!disable && user.enabled()) return { warn: `User is already enabled.`, data };
        if (disable && user.disabled()) return { warn: `User is already disabled.`, data };
        if (!execute) return { data };
        if (!disable) await user.enable();
        if (disable) await user.disable();
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}