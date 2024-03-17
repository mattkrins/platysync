import { Action, actionProps } from "../../typings/common.js";
import { getUser } from "../engine.js";

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
        groups: Group[];
        clean: boolean;
    }
}

export default async function ({ action, template, execute, data, connections, keys }: props) {
    try {
        const user = getUser(action, connections, keys, data);
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
        if (changes.length<=0) return { warn: 'No changes detected', data };
        data.changes = changes;
        if (!execute) return { data };
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