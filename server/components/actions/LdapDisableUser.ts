import { xError } from "../../modules/common.js";
import { props } from "../actions.js";
import LDAP, { LdapProps } from "../providers/LDAP.js";

export type LdapDisableUserProps = props<LdapProps>;

export default async function LdapDisableUser(props: props<LdapProps>, enable = false) {
    const { execute, data } = props;
    try {
        const user = await LDAP.getUser(props);
        if (enable && user.enabled()) return { warn: `User is already enabled.`, data };
        if (!enable && user.disabled()) return { warn: `User is already disabled.`, data };
        if (!execute) return { data };
        if (enable) await user.enable();
        if (!enable) await user.disable();
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
