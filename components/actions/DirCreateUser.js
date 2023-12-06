import Handlebars from "../../modules/handlebars.js";
import ldap, { User } from "../../modules/ldap.js";
export default async function createUser(execute = false, act, template, connections) {
    const action = act;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = {};
    try {
        data.directory = action.target;
        if (!(action.target in connections))
            return { error: 'Connector not found.', data };
        const client = connections[action.target].client;
        if (!client)
            return { error: 'LDAP client not found.', data };
        data.OUbase = client.base;
        data.upn = Handlebars.compile(action.upn || "")(template);
        if (!ldap.validUpn(data.upn))
            return { error: 'Invalid User Principal Name.', data };
        data.sam = Handlebars.compile(action.sam || "")(template);
        if (!ldap.validSam(data.sam))
            return { error: 'Invalid SAM Account Name.', data };
        data.cn = Handlebars.compile(action.cn || "")(template);
        data.ou = Handlebars.compile(action.ou || "")(template);
        data.password = Handlebars.compile(action.password || "")(template);
        data.enable = action.enable;
        const found = await client.searchUser('userPrincipalName', data.upn);
        if (found)
            return { warning: `User already exists.`, data };
        const attributes = (action.attributes || []).map(a => ({ ...a, value: Handlebars.compile(a.value || "")(template) }));
        data.attributes = attributes;
        const groups = (action.groups || []).map(a => Handlebars.compile(a || "")(template));
        data.groups = groups;
        data.dn = `cn=${data.cn}${data.ou !== "" ? `,${data.ou}` : ''}`;
        if (!execute)
            return { data };
        const reduced = attributes.reduce((object, entry) => (object[entry.name] = entry.value, object), {});
        const _attributes = {
            objectclass: 'User',
            sAMAccountName: data.sam,
            userPrincipalName: data.upn,
            cn: data.cn,
            ...reduced
        };
        if (data.password.trim() !== "")
            _attributes.unicodePwd = ldap.encodePassword(data.password);
        if (action.enable && _attributes.unicodePwd)
            _attributes.userAccountControl = "512";
        const new_user = await client.create(data.dn, _attributes, ['userAccountControl', 'distinguishedName']);
        const user = new User(new_user, client.client);
        for (const group of groups)
            await user.addGroup(group);
        return { success: true, data };
    }
    catch (e) {
        return { error: String(e), data };
    }
}
