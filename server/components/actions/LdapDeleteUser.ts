import { xError } from "../../modules/common.js";
import { getUser, LdapProps, props } from "../actions.js";

export default async function LdapDeleteUser(props: props<LdapProps>) {
    const { execute, data } = props;
    try {
        const user = await getUser(props, true);
        if (!user) return { warning: `User not found.`, data };
        if (!execute) return { data };
        await user.delete();
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
