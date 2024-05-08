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

export default async function ({ action, execute, data, connections, keys }: props) {
    try {
        const user = getUser(action, connections, keys, data);
        const flags: {[control: string]: boolean} = {
            ACCOUNTDISABLE: Boolean(action.ACCOUNTDISABLE),
            DONT_EXPIRE_PASSWD: Boolean(action.DONT_EXPIRE_PASSWD),
            SMARTCARD_REQUIRED: Boolean(action.SMARTCARD_REQUIRED),
            HOMEDIR_REQUIRED: Boolean(action.HOMEDIR_REQUIRED),
            PASSWORD_EXPIRED: Boolean(action.PASSWORD_EXPIRED),
            DONT_REQUIRE_PREAUTH: Boolean(action.DONT_REQUIRE_PREAUTH),
            TRUSTED_FOR_DELEGATION: Boolean(action.TRUSTED_FOR_DELEGATION),
            TRUSTED_TO_AUTH_FOR_DELEGATION: Boolean(action.TRUSTED_TO_AUTH_FOR_DELEGATION),
        };
        data.userAccountControl = await user.setAccountControl(flags, true);
        data.flags = flags;
        if (!execute) return { data };
        await user.setAccountControl(flags);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}