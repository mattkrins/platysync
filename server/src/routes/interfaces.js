import { add, encodePassword } from '../modules/ldap.js';
import { templateString } from '../modules/handlebars.js';
import { Template, Attribute, Group } from "../../db/models.js";
import { encryptStr } from '../modules/cryptography.js';

async function create( dry, rule, sAMAccountName, data, client, dn, base ) {
    const template = await Template.findOne({ where: { id: rule.TemplateId }, include: [ Attribute, Group ] });
    const cn = templateString(template.cn, data);
    const userPrincipalName = templateString(template.upn, data);
    const ou = template.ou.trim()!=="" ? templateString(template.ou, data) : false;
    const distinguishedName = `cn=${cn}${ou?`,${ou}`:''},${base}`;
    const userAttributes = {
        objectclass: 'User',
        sAMAccountName,
        userPrincipalName,
        cn: cn,
    };
    const remove = ['samaccountname','userprincipalname','cn','distinguishedname'];
    const filtered_attributes = template.Attributes.filter(a=>!remove.includes(a.key.toLowerCase()));
    for (const attribute of filtered_attributes) userAttributes[attribute.key] = templateString(attribute.value, data);
    const password = templateString(template.pass, data);
    if (password.trim()!=="") userAttributes.unicodePwd = encodePassword(password);
    if (rule.enable_account && userAttributes.unicodePwd ) userAttributes.userAccountControl = 512;
    const subActions = [];
    if (!dry){
        const user = await add(client, distinguishedName, userAttributes);
        for (const group of template.Groups){
            const groupDN = `${templateString(group.value, data)},${dn}`;
            try {
                await user.addToGroup(groupDN);
                subActions.push({ type: 'addgroup', group: groupDN, error: false })
            } catch (error) { subActions.push({ type: 'addgroup', group: groupDN, error }) }
        }
    } else {
        for (const group of template.Groups){
            const groupDN = `${templateString(group.value, data)},${dn}`;
            subActions.push({ type: 'addgroup', value: groupDN, error: false })
        }
    }

    return { subActions, userAttributes: {...userAttributes, password, distinguishedName, userPrincipalName}, cn }
}

async function update( dry, rule, user, data, dn ) {
    const template = await Template.findOne({ where: { id: rule.TemplateId }, include: [ Attribute, Group ] });
    const remove = ['samaccountname','userprincipalname','cn','distinguishedname'];
    const filtered_attributes = template.Attributes.filter(a=>!remove.includes(a.key.toLowerCase()));
    let subActions = [];
    let edustar_writeback = false;
    for (const attribute of filtered_attributes) {
        const key = attribute.key.toLowerCase();
        const current = user.attributes[key];
        if (!attribute.overwrite && current) continue;
        let expected = templateString(attribute.value, data);
        if (rule.edustar && rule.attribute.toLowerCase()===key.toLowerCase()) edustar_writeback = expected;
        if (attribute.encrypt){
            const password = templateString(attribute.password, data);
            expected = JSON.stringify(await encryptStr(expected, password));
        }
        if (current === expected || (expected.trim()==="" && !current)) continue;
        if (!dry) {
            try {
                await user.update({[key]: expected.trim()==="" ? null : expected });
                subActions.push({ type: 'editattribute', key, current, expected, error: false })
            } catch (error) { subActions.push({ type: 'editattribute', key, current, expected, error: String(error) }) }
        } else {  subActions.push({ type: 'editattribute', key, current, expected, error: false }) }
    }
    if (template.remove_groups) {
        const has = user.memberOf.map(g=>g.toLowerCase());
        const shouldHave = template.Groups.map(g=>`${templateString(g.value, data)},${dn}`.toLowerCase());
        const missing = shouldHave.filter(x => !has.includes(x));
        const shouldNotHave = has.filter(x => !shouldHave.includes(x));
        for (const groupDN of missing) {
            if (!dry) {
                try {
                    await user.addToGroup(groupDN);
                    subActions.push({ type: 'addgroup', group: groupDN, error: false })
                } catch (error) { subActions.push({ type: 'addgroup', group: groupDN, error: String(error) }) }
            } else {  subActions.push({ type: 'addgroup', value: groupDN, error: false }) }
        }
        for (const groupDN of shouldNotHave) {
            if (!dry) {
                try {
                    await user.removeFromGroup(groupDN);
                    subActions.push({ type: 'removegroup', group: groupDN, error: false })
                } catch (error) { subActions.push({ type: 'removegroup', group: groupDN, error: String(error) }) }
            } else {  subActions.push({ type: 'removegroup', value: groupDN, error: false }) }
        }
    }

    return { subActions, edustar_writeback }
}

export default async function action( dry, action, user, rule, sam, ...args ) {
    try {
        let result = {};
        switch (action) {
            case "create":{
                result = await create(dry, rule, sam, ...args);
            break; }
            case "update":{
                result = await update(dry, rule, user, ...args);
            break; }
            case "move":{
                if (!dry) await user.move(...args);
                result = {from: user.ou, to: args[0] };
            break; }
            default: {
                if (!dry) await user[action](...args);
                result = { action }
            break; }
        }
        return { cn: user? user.cn : result.cn, result, error: false };
    } catch (error) {
        return { cn: user.cn, error: String(error) };
    }
}
