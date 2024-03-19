import { Action, actionProps } from "../../typings/common.js";
import { default as ldapjs } from "ldapjs";
import { getUser } from "../engine.js";
import { compile } from "../../modules/handlebars.js";

interface Attribute {
    type: 'Add'|'Replace'|'Delete';
    name: string;
    value: string;
}

interface update extends Attribute {
    currentValue: string;
    success?: true;
    error?: string;
}

interface props extends actionProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    action: Action & {
        target: string;
        attributes: Attribute[];
    }
}

export default async function ({ action, template, execute, data, connections, keys }: props) {
    try {
        const user = getUser(action, connections, keys, data);
        data.attributes = user.attributes;
        const changes: update[] = [];
        for (const a of action.attributes) {
            switch (a.type) {
                case 'Add': {
                    const value = compile(template, a.value||"");
                    if (!(a.name in user.attributes)) changes.push({...a, value, currentValue: '' }); break;
                }
                case 'Replace': {
                    const value = compile(template, a.value||"");
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
        data.changes = changes;
        if (!execute) return { data };
        for (const i in changes) {
            const a = changes[i];
            let change: ldapjs.Change|undefined;
            switch (a.type) {
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
        data.changes = changes;
        return { success: true, data };
    } catch (e){
        return { error: String(e), data };
    }
}