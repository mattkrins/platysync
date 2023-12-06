import ldap, { User } from "../../modules/ldap.js";
import Handlebars from "../../modules/handlebars.js";
export default async function enableUser(execute = false, act, template, connections, disable = false) {
    const action = act;
    const data = {};
    try {
        data.directory = action.target;
        if (!(action.target in connections))
            return { error: 'Connector not found.', data };
        const client = connections[action.target].client;
        if (!client)
            return { error: 'LDAP client not found.', data };
        data.upn = Handlebars.compile(action.upn)(template);
        if (!ldap.validUpn(data.upn))
            return { error: 'Invalid User Principal Name.', data };
        const found = await client.searchUser('userPrincipalName', data.upn, ['userAccountControl', 'distinguishedName']);
        if (!found)
            return { error: `User does not exist.`, data };
        const user = new User(found, client.client);
        if (!disable && user.enabled())
            return { warning: `User is already enabled.`, data };
        if (disable && user.disabled())
            return { warning: `User is already disabled.`, data };
        if (!execute)
            return { data };
        if (!disable)
            await user.enable();
        if (disable)
            await user.disable();
        return { success: true, data };
    }
    catch (e) {
        return { error: String(e), data };
    }
}
