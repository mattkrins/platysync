import { xError } from "../../modules/common.js";
import { getUser, LdapProps, props } from "../actions.js";

interface LdapUpdateAccount extends LdapProps {
    ACCOUNTDISABLE: boolean;
    DONT_EXPIRE_PASSWD: boolean;
    SMARTCARD_REQUIRED: boolean;
    HOMEDIR_REQUIRED: boolean;
    PASSWORD_EXPIRED: boolean;
    DONT_REQUIRE_PREAUTH: boolean;
    TRUSTED_FOR_DELEGATION: boolean;
    TRUSTED_TO_AUTH_FOR_DELEGATION: boolean;
    [k: string]: unknown;
}

export default async function LdapUpdateAccount(props: props<LdapUpdateAccount>) {
    const { execute, data, action } = props;
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
    try {
        const user = await getUser(props);
        data.userAccountControl = await user.setAccountControl(flags, true) as unknown as string;
        data.flags = flags as unknown as string;
        if (!execute) return { data };
        await user.setAccountControl(flags);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
