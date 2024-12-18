import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../operations.js";
import LDAP from "../../modules/ldap.js";
import { default as ldapjs } from "ldapjs";
import { LDAPOperation } from "../operation.js";

export interface ldapAttribute {
    method: 'add'|'replace'|'delete';
    name: string;
    value: string;
}

export interface ldapAttributeUpdate extends ldapAttribute {
    currentValue: string;
    success?: true;
    error?: string;
}

export default class LdapUpdateGroups extends LDAPOperation {
    attributes: ldapAttribute[] = [];
    changes!: string;
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        super.execute({ action, template, execute, data, ...rest });
        try {
            const user = await this.getUser({ action, template, execute, data, ...rest });
            data.attributes = user.attributes as unknown as string;
            const changes: ldapAttributeUpdate[] = [];
            for (const a of action.attributes) {
                switch (a.method) {
                    case 'add': {
                        const value = compile(template, a.value||"");
                        if (!(a.name in user.attributes)) changes.push({...a, value, currentValue: '' }); break;
                    }
                    case 'replace': {
                        const value = compile(template, a.value||"");
                        if (a.name==="password"){
                            const unicodePwd = LDAP.encodePassword(value);
                            changes.push({...a, name: 'unicodePwd', value: unicodePwd, currentValue: '' });
                            break;
                        }
                        const currentValue = String(user.attributes[a.name]||'');
                        if (currentValue===value) break;
                        changes.push({...a, value, currentValue });
                        break;
                    }
                    case 'delete': {
                        if (!(a.name in user.attributes)) break;
                        changes.push({...a, currentValue: '' }); break;
                    }
                    default: break;
                }
            }
            if (changes.length<=0) return { warn: 'No changes detected', data };
            data.changes = changes as unknown as string;
            if (!execute) return { data };
            for (const i in changes) {
                const a = changes[i];
                let change: ldapjs.Change|undefined;
                switch (a.method) {
                    case 'add': {
                        change = new ldapjs.Change({
                            operation: 'add',
                            modification: new ldapjs.Attribute({
                                type: a.name,
                                values: String(a.value)
                            })
                        }); break;
                    }
                    case 'delete': {
                        change = new ldapjs.Change({
                            operation: 'delete',
                            modification: new ldapjs.Attribute({
                                type: a.name,
                            })
                        }); break;
                    }
                    default: {
                        change = new ldapjs.Change({
                            operation: 'replace',
                            modification: new ldapjs.Attribute({
                                type: a.name,
                                values: String(a.value)
                            })
                        });
                    }
                }
                try {
                    await user.change(change);
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
