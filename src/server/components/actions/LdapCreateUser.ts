import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import LDAP from "../../modules/ldap.js";
import { props } from "../actions.js";
import LDAPProvider from "../providers/LDAP.js";

interface LdapCreateUser {
    connector: string;
    attributes: { name: string, value: string }[];
    groups: string[];
    sam: string;
    upn: string;
    cn?: string;
    ou?: string;
    password: string;
    enable: boolean;
    dn?: string;
    userFilter?: string;
}

export default async function LdapCreateUser({ action, template, execute, data, connections, engine, id }: props<LdapCreateUser>) {
    try {
        data.connector = String(action.connector);
        if (!data.connector) throw new xError("Connector not provided.");
        const ldap = connections[data.connector] as LDAPProvider|undefined;
        if (!ldap || !ldap.client) throw new xError(`Provider '${data.connector}' not connected.`);
        if (action.userFilter) {
            data.userFilter = compile(template, action.userFilter);
            const user = await engine.ldap_getUser( data.connector, template, id );
            if (user) return { warning: `User already exists.`, data };
        }
        const attributes = action.attributes.filter(a=>a.name).map(a=>({...a, value: compile(template, a.value) })).filter(a=>a.value);
        data.attributes = attributes as unknown as string;
        const groups = action.groups.map(a=>compile(template, a)).filter(a=>a);
        data.groups = groups as unknown as string;
        data.sam = compile(template, action.sam);
        data.upn = compile(template, action.upn);
        data.cn = compile(template, action.cn, action.sam);
        data.ou = compile(template, action.ou);
        data.password = compile(template, action.password);
        data.enable = String(action.enable);
        data.dn = `CN=${data.cn}${data.ou?`,${data.ou}`:''}`;
        if (action.enable && !data.password) throw new xError("Cannot enable passwordless accounts.");
        if (!data.sam) throw new xError("sAMAccountName not provided.");
        if (!data.upn) throw new xError("userPrincipalName not provided.");
        if (!execute) return { data };
        const reduced = attributes.reduce((object: {[k:string]:string} ,entry)=> (object[entry.name]=entry.value,object),{});
        const _attributes: {[k:string]:string} = {
            objectclass: 'User',
            sAMAccountName: data.sam,
            userPrincipalName: data.upn,
            cn: data.cn,
            ...reduced
        };
        if (data.password) _attributes.unicodePwd = LDAP.encodePassword(data.password);
        if (action.enable && _attributes.unicodePwd ) _attributes.userAccountControl = "512";
        const { User } = await ldap.client.create(data.dn, _attributes, ['userAccountControl', 'distinguishedName'] );
        for (const group of groups) await User.addGroup(group);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
