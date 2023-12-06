import { connections } from "../rules.js";
import { Action, result, template } from '../../typings/common.js'
import ldap, { User } from "../../modules/ldap.js";
import Handlebars from "../../modules/handlebars.js";

interface EnableUser extends Action {
    target: string;
    upn: string;
}

export default async function enableUser(execute = false, act: Action, template: template, connections: connections, disable = false): Promise <result> {
    const action = act as EnableUser;
    const data: {[k: string]: string} = {};
    try {
        data.directory = action.target;
        if (!(action.target in connections)) return {error: 'Connector not found.', data};
        const client = connections[action.target].client as ldap;
        if (!client) return {error: 'LDAP client not found.', data};
        data.upn = Handlebars.compile(action.upn)(template);
        if (!ldap.validUpn(data.upn)) return {error: 'Invalid User Principal Name.', data};
        const found = await client.searchUser('userPrincipalName', data.upn, ['userAccountControl', 'distinguishedName'] );
        if (!found) return {error: `User does not exist.`, data};
        const user = new User(found, client.client );
        if (!disable && user.enabled()) return {warning: `User is already enabled.`, data};
        if (disable && user.disabled()) return {warning: `User is already disabled.`, data};
        if (!execute) return {data};
        if (!disable) await user.enable();
        if (disable) await user.disable();
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
