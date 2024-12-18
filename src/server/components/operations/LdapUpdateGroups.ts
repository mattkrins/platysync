import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../operations.js";
import { LDAPOperation } from "../operation.js";

interface Group {
    method: 'add'|'delete';
    value: string;
}

interface update extends Group {
    success?: true;
    error?: string;
}

export default class LdapUpdateGroups extends LDAPOperation {
    groups: Group[] = [];
    sanitize: boolean = false;
    changes!: string;
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        super.execute({ action, template, execute, data, ...rest });
        try {
            data.sanitize = String(action.sanitize);
            const user = await this.getUser({ action, template, execute, data, ...rest });
            data.groups = user.groups as unknown as string;
            const changes: update[] = [];
            const adding = action.groups.filter((g:{method: string})=>g.method==="Add").map(g=>g.value);
            if (action.sanitize){
                for (const v of user.attributes.memberOf) {
                    const value = compile(template, v||"");
                    if (adding.includes(value)) continue;
                    changes.push({ method: 'delete', value });
                }
            }
            for (const {method, value: v} of action.groups) {
                const value = compile(template, v||"");
                switch (method) {
                    case 'add': {
                        if (user.hasGroup(value)) break;
                        changes.push({ method, value }); break;
                    }
                    case 'delete': {
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
                    if (method==="add") await user.addGroup(value);
                    if (method==="delete") await user.removeGroup(value);
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
}