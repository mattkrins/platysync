import { xError } from "../../modules/common.js";
import { props } from "../actions.js";
import LDAP, { LdapProps } from "../providers/LDAP.js";

export default async function LdapDeleteUser(props: props<LdapProps>) {
    const { execute, data } = props;
    try {
        const user = await LDAP.getUser(props, true);
        if (!user) return { warning: `User not found.`, data };
        if (!execute) return { data };
        await user.delete();
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
