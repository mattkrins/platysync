import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../actions.js";
import LDAP, { LdapProps } from "../providers/LDAP.js";

interface Group {
    method: 'Add'|'Delete';
    value: string;
}

interface update extends Group {
    success?: true;
    error?: string;
}

interface LdapUpdateGroups extends LdapProps {
    groups: Group[];
    sanitize: boolean;
    [k: string]: unknown;
}

export default async function LdapUpdateGroups(props: props<LdapUpdateGroups>) {
    const { action, template, execute, data } = props;
    try {
        data.sanitize = String(action.sanitize);
        const user = await LDAP.getUser(props);
        data.groups = user.groups as unknown as string;
        const changes: update[] = [];
        const adding = action.groups.filter((g:{method: string})=>g.method==="Add").map(g=>g.value);
        if (action.sanitize){
            for (const v of user.attributes.memberOf) {
                const value = compile(template, v||"");
                if (adding.includes(value)) continue;
                changes.push({ method: 'Delete', value });
            }
        }
        for (const {method, value: v} of action.groups) {
            const value = compile(template, v||"");
            switch (method) {
                case 'Add': {
                    if (user.hasGroup(value)) break;
                    changes.push({ method, value }); break;
                }
                case 'Delete': {
                    if (!user.hasGroup(value)) break;
                    changes.push({ method, value }); break;
                }
                default: break;
            }
        }
        if (changes.length<=0) return { warn: 'No changes detected', data };
        data.changes = changes as unknown as string;
        if (!execute) return { data };
        for (const i in changes) {
            const { method, value } = changes[i];
            try {
                if (method==="Add") await user.addGroup(value);
                if (method==="Delete") await user.removeGroup(value);
                changes[i].success = true;
            } catch (e) {
                changes[i].error = String(e);
            }
        }
        data.changes = changes as unknown as string;
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
