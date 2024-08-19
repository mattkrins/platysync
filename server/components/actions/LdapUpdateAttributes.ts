import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../actions.js";
import LDAPprovider, { LdapProps } from "../providers/LDAP.js";
import LDAP from "../../modules/ldap.js";
import { default as ldapjs } from "ldapjs";

interface Attribute {
    method: 'Add'|'Replace'|'Delete';
    name: string;
    value: string;
}

interface update extends Attribute {
    currentValue: string;
    success?: true;
    error?: string;
}

interface LdapUpdateAttributes extends LdapProps {
    attributes: Attribute[];
    [k: string]: unknown;
}

export default async function LdapUpdateAttributes(props: props<LdapUpdateAttributes>) {
    const { action, template, execute, data } = props;
    try {
        const user = await LDAPprovider.getUser(props);
        data.attributes = user.attributes as unknown as string;
        const changes: update[] = [];
        for (const a of action.attributes) {
            switch (a.method) {
                case 'Add': {
                    const value = compile(template, a.value||"");
                    if (!(a.name in user.attributes)) changes.push({...a, value, currentValue: '' }); break;
                }
                case 'Replace': {
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
                case 'Delete': {
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
                case 'Add': {
                    change = new ldapjs.Change({
                        operation: 'add',
                        modification: new ldapjs.Attribute({
                            type: a.name,
                            values: String(a.value)
                        })
                    }); break;
                }
                case 'Delete': {
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
