import { Action, actionProps } from "../../typings/common.js";
import { getUser } from "../engine.js";
import { xError } from "../../modules/common.js";

export interface props extends actionProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    action: Action & {
        target: string;
        ACCOUNTDISABLE: boolean;
        DONT_EXPIRE_PASSWD: boolean;
        SMARTCARD_REQUIRED: boolean;
        HOMEDIR_REQUIRED: boolean;
        PASSWORD_EXPIRED: boolean;
        DONT_REQUIRE_PREAUTH: boolean;
        TRUSTED_FOR_DELEGATION: boolean;
        TRUSTED_TO_AUTH_FOR_DELEGATION: boolean;
    }
}

export default async function ({ action, execute, data, connections, keys }: props, disable = false) {
    try {
        const user = getUser(action, connections, keys, data);
        if (!disable && user.enabled()) return { warn: `User is already enabled.`, data };
        if (disable && user.disabled()) return { warn: `User is already disabled.`, data };
        const flags: {[control: string]: boolean} = {};
        if (action.ACCOUNTDISABLE) flags.ACCOUNTDISABLE = true;
        if (action.DONT_EXPIRE_PASSWD) flags.DONT_EXPIRE_PASSWD = true;
        if (action.SMARTCARD_REQUIRED) flags.SMARTCARD_REQUIRED = true;
        if (action.HOMEDIR_REQUIRED) flags.HOMEDIR_REQUIRED = true;
        if (action.PASSWORD_EXPIRED) flags.PASSWORD_EXPIRED = true;
        if (action.DONT_REQUIRE_PREAUTH) flags.DONT_REQUIRE_PREAUTH = true;
        if (action.TRUSTED_FOR_DELEGATION) flags.TRUSTED_FOR_DELEGATION = true;
        if (action.TRUSTED_TO_AUTH_FOR_DELEGATION) flags.TRUSTED_TO_AUTH_FOR_DELEGATION = true;
        data.flags = flags;
        if (!execute) return { data };
        await user.setAccountControl(flags);

        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}