import { Action, actionProps } from "../../typings/common.js";
import { User } from "../../modules/ldap.js";
import { xError } from "../../modules/common.js";

export interface props extends actionProps {
    action: Action & {
        target: string;
    }
}

export default async function ({ action, execute, data, connections, keys }: props) {
    try {
        data.directory = action.target;
        if (!(action.target in connections)) throw new xError(`Connector ${action.target} not found.`);
        const id = keys[action.target];
        if (!(id in connections[action.target].keyed)) return { warning: `User ${id} not found in ${action.target}.`, data };
        const user = connections[action.target].keyed[id] as User;
        if (!execute) return { data };
        await user.delete();
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}