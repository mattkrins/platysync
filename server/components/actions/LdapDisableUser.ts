import { xError } from "../../modules/common.js";
import { getUser, LdapProps, props } from "../actions.js";

export type LdapDisableUserProps = props<LdapProps>;

export default async function LdapDisableUser(props: props<LdapProps>, enable = false) {
    const { execute, data } = props;
    try {
        const user = await getUser(props);
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
