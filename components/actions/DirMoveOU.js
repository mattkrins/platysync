import ldap, { User } from "../../modules/ldap.js";
import Handlebars from "../../modules/handlebars.js";
export default async function moveOU(execute = false, act, template, connections) {
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
        data.ou = Handlebars.compile(action.ou)(template);
        if (!ldap.validUpn(data.upn))
            return { error: 'Invalid User Principal Name.', data };
        const found = await client.searchUser('userPrincipalName', data.upn, ['userAccountControl', 'distinguishedName']);
        if (!found)
            return { error: `User does not exist.`, data };
        const user = new User(found, client.client);
        data.currentOu = ldap.ouFromDn(user.attributes.distinguishedName).toLowerCase();
        if (data.ou.toLowerCase() === data.currentOu)
            return { warning: `User already resides in target OU.`, data };
        //REVIEW - Should we validate OU path?
        if (!execute)
            return { data };
        await user.move(data.ou);
        return { success: true, data };
    }
    catch (e) {
        return { error: String(e), data };
    }
}
