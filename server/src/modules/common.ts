import { Schema } from "../typings/common.js";

function hasChild(haystack: string|undefined = "", needle: string){
    return String(haystack).includes(`{{`) && (String(haystack).includes(`.${needle}`) || String(haystack).includes(`/${needle}`));
}
function hasParent(haystack: string|undefined = "", needle: string){
    return String(haystack).includes(`{{`) && (String(haystack).includes(`${needle}.`) || String(haystack).includes(`${needle}/`));
}
export function findDependencies(schema: Schema, name: string, child = false, templatesOnly = true){
    const  hasHandle = child ? hasChild : hasParent;
    for (const connector of schema.connectors) {
        if (connector.path && hasHandle(connector.path, name)) return connector.name;
        if (templatesOnly) continue;
        if (connector.proxy && connector.proxy===name) return connector.name;
    }
    for (const rule of schema.rules) {
        if (hasHandle(rule.display, name)) return rule.name;
        for (const secondary of rule.secondaries||[]) {
            if (templatesOnly) continue;
            if (secondary.primary===name) return rule.name;
        }
        for (const condition of rule.conditions||[]) {
            if (hasHandle(condition.key, name)) return rule.name;
            if (hasHandle(condition.value, name)) return rule.name;
        }
        for (const action of rule.actions||[]) {
            if (hasHandle(action.value, name)) return rule.name;
            if (hasHandle(action.source, name)) return rule.name;
            if (hasHandle(action.target, name)) return rule.name;
            if (hasHandle(action.upn, name)) return rule.name;
            if (hasHandle(action.ou, name)) return rule.name;
            for (const attribute of action.attributes||[]) if (hasHandle(attribute.value, name)) return rule.name;
            for (const group of action.groups||[]) if (hasHandle(group as string, name)) return rule.name;
            for (const template of action.templates||[]) {
                if (hasHandle(template.name, name)) return rule.name;
                if (hasHandle(template.value, name)) return rule.name;
            }
        }
        if (templatesOnly) continue;
        if (rule.primary===name) return rule.name;
        if (rule.config && rule.config[name]) return rule.name;
        for (const config of Object.values(rule.config||{})) {
            for (const value of Object.values(config||{})) {
                if (String(value)===name) return rule.name;
            }
        }
    } return false;
}