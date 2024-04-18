import { Action, actionProps } from "../../typings/common.js";
import ldap, { User } from "../../modules/ldap.js";
import { compile } from "../../modules/handlebars.js";
import { getUser } from "../engine.js";
import { xError } from "../../modules/common.js";

export interface props extends actionProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    action: Action & {
        target: string;
        attributes: {
            name: string;
            value: string;
        }[];
        groups: string[];
        sam: string;
        upn: string;
        cn: string;
        ou: string;
        password: string;
        enable: boolean;
    }
}

export default async function ({ action, template, execute, data, connections, keys }: props) {
    try {
        try {
            const user = getUser(action, connections, keys, data);
            if (user) return { warn: `User already exists.`, data };
        } catch (e){ /**/ }
        if (!(action.target in connections)) throw new xError(`Connector ${action.target} not found.`);
        const attributes = (action.attributes||[]).map(a=>({...a, value: compile(template, a.value||"")}));
        data.attributes = attributes;
        const groups = (action.groups||[]).map((a: string)=>compile(template, a||""));
        data.groups = groups;
        data.sam = compile(template, action.sam||"");
        data.upn = compile(template, action.upn||"");
        data.cn = compile(template, action.cn||"");
        data.ou = compile(template, action.ou||"");
        data.password = compile(template, action.password||"");
        data.dn = `cn=${data.cn}${data.ou!==""?`,${data.ou}`:''}`;
        data.enable = String(action.enable);
        const client = connections[action.target].client as ldap;
        if (!client) throw new xError('LDAP client not found.');
        if (!execute) return { data };
        const reduced = attributes.reduce((object: {[k:string]:string|string[]} ,entry)=> (object[entry.name]=entry.value,object),{});
        const _attributes: {[k:string]:string|string[]} = {
            objectclass: 'User',
            sAMAccountName: data.sam,
            userPrincipalName: data.upn,
            cn: data.cn,
            ...reduced
        };
        if (data.password.trim()!=="") _attributes.unicodePwd = ldap.encodePassword(data.password);
        if (action.enable && _attributes.unicodePwd ) _attributes.userAccountControl = "512";
        const new_user = await client.create(data.dn, _attributes, ['userAccountControl', 'distinguishedName'] );
        const user = new User(new_user, client.client );
        for (const group of groups) await user.addGroup(group);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}