import { xError } from "../../modules/common.js";
import LDAP from "../../modules/ldap.js";
import { props } from "../actions.js";
import LDAPprovider, { LdapProps } from "../providers/LDAP.js";

interface LdapMoveOU extends LdapProps {
    ou: string;
    [k: string]: unknown;
}

export default async function LdapMoveOU(props: props<LdapMoveOU>) {
    const { execute, data } = props;
    try {
        const user = await LDAPprovider.getUser(props);
        data.currentOu = LDAP.ouFromDn(user.attributes.distinguishedName).toLowerCase();
        if (data.ou.toLowerCase() === data.currentOu) return { warn: `User already resides in target OU.`, data };
        if (!execute) return { data };
        await user.move(data.ou);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}