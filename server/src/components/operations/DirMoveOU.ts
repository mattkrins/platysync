import { Action, actionProps } from "../../typings/common.js";
import ldap from "../../modules/ldap.js";
import { compile } from "../../modules/handlebars.js";
import { getUser } from "../engine.js";

export interface props extends actionProps {
    action: Action & {
        target: string;
        ou: string;
    }
}

export default async function ({ action, template, execute, data, connections, keys }: props) {
    try {
        data.ou = compile(template, action.ou);
        const user = getUser(action, connections, keys, data);
        data.currentOu = ldap.ouFromDn(user.attributes.distinguishedName).toLowerCase();
        if (data.ou.toLowerCase() === data.currentOu) return { warn: `User already resides in target OU.`, data };
        if (!execute) return { data };
        await user.move(data.ou);
        return { success: true, data };
    } catch (e){
        return { error: String(e), data };
    }
}