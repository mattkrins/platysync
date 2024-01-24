import { Action, result, template } from "../../typings/common.js";
import { connections } from "../rules.js";
import Handlebars from "../../modules/handlebars.js";
import ldap, { User } from "../../modules/ldap.js";
//import { default as ldapjs } from "ldapjs";

interface Group {
    type: 'Add'|'Delete';
    value: string;
}

interface DirUpdateSec extends Action  {
    target: string;
    upn: string;
    groups: Group[];
    clean: boolean;
}

interface update extends Group {
    success?: true;
    error?: string;
}

export default async function dirUpdateSec(execute = false, act: Action, template: template, connections: connections, ): Promise <result> {
    const action = act as DirUpdateSec;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: {[k: string]: any} = {};
    try {
        data.directory = action.target;
        if (!(action.target in connections)) return {error: 'Connector not found.', data};
        const client = connections[action.target].client as ldap;
        if (!client) return {error: 'LDAP client not found.', data};
        data.upn = Handlebars.compile(action.upn)(template);
        if (!ldap.validUpn(data.upn)) return {error: 'Invalid User Principal Name.', data};
        const found = await client.searchUser('userPrincipalName', data.upn, ['distinguishedName', 'memberOf'] );
        if (!found) return {error: `User does not exist.`, data};
        const user = new User(found, client.client );
        data.groups = user.groups;
        const changes: update[] = [];
        const adding = action.groups.filter(g=>g.type==="Add").map(g=>g.value);
        if (action.clean){
            for (const v of user.attributes.memberOf) {
                const value = Handlebars.compile(v||"")(template);
                if (adding.includes(value)) continue;
                changes.push({ type: 'Delete', value });
            }
        }
        for (const {type, value: v} of action.groups) {
            const value = Handlebars.compile(v||"")(template);
            switch (type) {
                case 'Add': {
                    if (user.hasGroup(value)) break;
                    changes.push({ type, value }); break;
                }
                case 'Delete': {
                    if (!user.hasGroup(value)) break;
                    changes.push({ type, value }); break;
                }
                default: break;
            }
        }
        if (changes.length<=0) return {warning: `No changes required.`, data};
        data.changes = changes;
        if (!execute) return {data};
        for (const i in changes) {
            const {type, value} = changes[i];
            try {
                await user.addGroup(value, type==="Add" );
                changes[i].success = true;
            } catch (e) {
                changes[i].error = String(e);
            }
        }
        data.changes = changes;
        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
