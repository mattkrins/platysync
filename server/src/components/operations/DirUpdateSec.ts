import { Action } from "../../typings/common.js";
import { actionProps } from "../engine.js";
import ldap, { User } from "../../modules/ldap.js";

interface Group {
    type: 'Add'|'Delete';
    value: string;
}

interface update extends Group {
    success?: true;
    error?: string;
}

interface props extends actionProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    action: Action & {
        target: string;
        upn: string;
        groups: Group[];
        clean: boolean;
    }
}

export default async function ({ action, template, execute, data, connections, keys }: props) {
    try {
        data.directory = action.target;
        if (!(action.target in connections)) throw Error(`Connector ${action.target} not found.`);
        const id = keys[action.target];
        if (!(id in connections[action.target].keyed)) throw Error(`Useer ${id} not found in ${action.target}.`);
        const user = connections[action.target].keyed[id] as User;
        data.groups = user.groups;
        const changes: update[] = [];
        const adding = action.groups.filter((g:{type: string})=>g.type==="Add").map(g=>g.value);
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
        if (changes.length<=0) throw Error('No changes required.');
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
        return { success: true, data };
    } catch (e){
        return { error: String(e), data };
    }
}