import { Schema, Rule, Template, Attribute, Group, Condition, Override, Print } from "../../db/models.js";
import { loadCSV, dynamicSortMultiple } from '../modules/common.js';
import { templateString } from '../modules/handlebars.js';
import { login, getUsers, User } from '../modules/ldap.js';
import { decrypt, getKey } from '../modules/cryptography.js';
import { writePDF } from '../modules/common.js';
import action from './interfaces.js'
import { printJob } from './print.js'
import { io } from '../index.js';
import eduSTAR from '../modules/eduSTAR.js';
import fs from 'fs'
import { printPath } from './print.js'

let progress = 0;
const ratePerMs = 1;
let date1 = new Date(); 
function setProgress(p=0, status="Idle", SchemaName, error = false, byPass = false) {
    progress = p;
    if (!byPass && (Math.abs(new Date() - date1) < ratePerMs)) return;
    io.emit(`progress`, {count: p, status, SchemaName, error});
    date1 = new Date();
}

function prepare( schema ) {
    return new Promise((resolve, reject) =>
        (async () => {
          try {
            setProgress(progress, "Loading CSV");
            const csv = await loadCSV(schema.csv_path);
            setProgress(progress, "Logging into LDAP");
            const key = await getKey();
            const password = await decrypt(schema.ldap_pass, key);
            const { client, dn } = await login(schema.ldap_uri, schema.ldap_user, password); // todo: update ldapjs library to 3.0
            let base = dn;
            if (schema.base_ou.trim()!=="") base = `${schema.base_ou},${base}`;
            let attributes = [];
            let usesEduSTAR = false;
            for (const rule of (schema.Rules||[])) {
                if (!rule.enabled) continue;
                const att = rule.Conditions.filter(c => c.operand==="attribute").map(c => c.key)
                attributes = [...attributes, ...att];
                if (rule.edustar) usesEduSTAR = true;
            }
            for (const template of (schema.Templates||[])) {
                const att = template.Attributes.map(t => t.key)
                attributes = [...attributes, ...att];
            }
            attributes = attributes.filter((v, i, self) => i === self.findIndex(t => t === v) );
            setProgress(progress, "Finding users");
            const directory = await getUsers(client, base, attributes);
            let edustar = false;
            if (schema.use_edustar && usesEduSTAR){
                setProgress(progress, "Logging into eduSTAR Management Centre");
                edustar = new eduSTAR();
                await edustar.init();
                await edustar.login();
                setProgress(progress, "Downloading eduSTAR data");
                await edustar.getMatches(csv.data);
            }
            //if (op2 == null) throw new Error('Validation error');
            resolve( { csv, client, dn, base, directory, edustar } )
          } catch (e) { reject(e) }
        })()
    );
}


function compare(operator, key, value, delimited){
    switch (operator) {
            case '==': {
                if (!delimited && key===value) return true;
                if (delimited && delimited.includes(key)) return true;
            break; }
            case '!=': {
                if (!delimited && key!==value) return true;
                if (delimited && !delimited.includes(key)) return true;
            break; }
            case 'contains': {
                if (!delimited && String(key).includes(value)) return true;
                if (delimited && delimited.includes(key)) return true;
            break; }
            case 'missing': {
                if (!delimited && !String(key).includes(value)) return true;
                if (delimited && !delimited.includes(key)) return true;
            break; }
            case 'starts': {
                if (!delimited && String(key).startsWith(value)) return true;
                let evaluated = 0;
                for (const v of (delimited||[])) if (String(key).startsWith(v)) evaluated++;
                if (evaluated >= delimited.length) return true;
            break; }
            case 'ends': {
                if (!delimited && String(key).endsWith(value)) return true;
                let evaluated = 0;
                for (const v of (delimited||[])) if (String(key).endsWith(v)) evaluated++;
                if (evaluated >= delimited.length) return true;
            break; }
            default: return false;
    } return false;
}

function evaluate( { operand, operator, key, value, delimiter }, data, user ) {
    try {
        const Value = templateString(value, data);
        const delimited = delimiter.trim()!=="" ? String(Value).split(delimiter) : false;
        switch (operand) {
            case 'input': {
                const Key = templateString(key, data);
                return compare( operator, Key, Value, delimited );
            }
            case 'attribute': {
                const Key = user.attributes[key.toLowerCase()];
                if (!Key) return false;
                return compare( operator, Key, Value, delimited );
            }
            case 'security': switch (operator) {
                    case 'contains': {
                        if (!delimited && (user.memberOfGroupName(Value)||user.memberOfGroup(Value))) return true;
                        let evaluated = 0;
                        for (const group of (delimited||[])) if (user.memberOfGroupName(group)||user.memberOfGroup(group)) evaluated++;
                        return (evaluated >= delimited.length);
                    }
                    case 'missing': {
                        if (!delimited && (!user.memberOfGroupName(Value)&&!user.memberOfGroup(Value))) return true;
                        let evaluated = 0;
                        for (const group of (delimited||[])) if (!user.memberOfGroupName(group)&&!user.memberOfGroup(group)) evaluated++;
                        return (evaluated >= delimited.length);
                    }
                    default: return false;
            }
            default: return false;
        }
      } catch (e) { console.error("Error evaluating condition.");  return false; }
}

function process( data, rule, user ) {
    return new Promise((resolve, reject) =>
        (async () => {
            const evaluatedConditions = [];
            try {
            for (const condition of rule.Conditions) if (evaluate(condition, data, user)){ evaluatedConditions.push(condition) }
            resolve( evaluatedConditions.length >= rule.Conditions.length ? evaluatedConditions : false );
            } catch (e) { reject(e) }
        })()
    );
}

function savePDF(id, data, SchemaName, sam, real) {
    return new Promise((resolve, reject) =>
        (async () => {
            try {
                const template = await Template.findOne({ where: { id }, include: [ Attribute, Group ] });
                const source = templateString(template.pdf_source, data);
                let target = templateString(template.pdf_target, data);
                if (target.trim()==="") target = `${printPath}/${sam}.pdf`;
                if (!fs.existsSync(source)) return reject(`Path '${source}' does not exist`);
                if (!real) return resolve({path: target});
                await writePDF(source, target, data, SchemaName);
                const job = await Print.create({ path: target, status: 1, SchemaName, sam });
                resolve(job)
            } catch (e) { reject(e) }
        })()
    );
}


export async function run(res, err, real = false, SchemaName, RuleType, UserFilter) {
    try {
        let options = {};
        if (SchemaName) options = { where: { name: SchemaName } };
        if (RuleType==="print"){
            let options2 = {};
            if (SchemaName) options2 = { where: { SchemaName }, raw: true };
            setProgress(0, "Finding print jobs", SchemaName);
            let jobs = await Print.findAll(options2) || [];
            setProgress(100, "Done", SchemaName);
            return res.json({sorted: jobs, errors: []});
        }
        setProgress(0, "Preparing");
        const schemas = await Schema.findAll({ ...options, include: [
            {model: Template, include: [ Attribute, Group ]},
            {model: Rule, include: [ Condition ]},
            Override
        ] });
        let results = [];
        let errors = [];
        const totals = {};
        for (let i = 0; i < schemas.length; i++) {
            const schema = schemas[i];
            const schemaProgress = ((i+1) / schemas.length)*100;
            let ldap = {};
            try {
                const { csv, directory, client, dn, base, edustar } = await prepare( schema );
                ldap = client;
                let edustar_writeback = [];
                for (let row = 0; row < csv.data.length; row++) {
                    const csvProgress = ((row+1) / csv.data.length)*schemaProgress;
                    setProgress(csvProgress, `Proccessing Row ${row}`, schema.name);
                    let data = csv.data[row];
                    if (schema.csv_header.trim()==="") continue;
                    const sam = data[schema.csv_header];
                    if (!sam) continue;
                    if (UserFilter && !UserFilter.includes(sam) ) continue;
                    if (edustar && edustar.matches[sam]) data = {...data, ...edustar.matches[sam] };
                    const match = directory.usersObject[sam.toLowerCase()];
                    const user = match ? new User(match, client) : false;
                    //console.log(`  Loading '${data.STKEY}':`)
                    for (const override of schema.Overrides) data[override.key] = templateString(override.value, data);
                    //console.log("print")
                    for (const rule of (schema.Rules||[])) {
                        if (RuleType && RuleType!==rule.type) continue; 
                        if (!rule.enabled) continue;
                        if (rule.type!=='create' && !user) continue;
                        const processed = await process( data, rule, user );
                        if (!processed) continue;
                        let result = {};
                        switch (rule.type) {
                            case 'update': {
                                result = await action(!real, "update", user, rule, sam, data, dn);
                            break; }
                            case 'delete': {
                                result = await action(!real, "delete", user, rule, sam);
                            break; }
                            case 'move': {
                                const ou = `${templateString(rule.ou, data)},${base}`;
                                if (user.ou.toLowerCase() === ou.toLowerCase() ) continue; // user already in OU
                                result = await action(!real, "move", user, rule, sam, ou);
                            break; }
                            case 'enable': {
                                if (user.enabled()) continue; // user already enabled
                                result = await action(!real, "enable", user, rule, sam)
                            break; }
                            case 'disable': {
                                if (user.disabled()) continue; // user already disabled
                                result = await action(!real, "disable", user, rule, sam)
                            break; }
                            case 'create': {
                                if (user) continue; // user already exists
                                result = await action(!real, "create",  user, rule, sam, data, client, dn, base)
                            break; }
                            default: continue;
                        }
                        if (!result.result){
                            if (result.error) errors.push({schema: schema.name, message: result.error})
                            continue;
                        }
                        if ( rule.type==='update' && result.result.subActions.length <=0 ) continue; // no changes found
                        let job = false;
                        let error = false;
                        try {
                            if (rule.gen_pdf){
                                const attributes = user ? user.attributes : (result.result.userAttributes || {});
                                io.emit(`progress`, {count: csvProgress, status: `Writing ${sam}`, SchemaName: schema.name, error: false});
                                job = await savePDF(rule.TemplateId, {...data, ...attributes}, schema.name, sam, real);
                                if (rule.print && job.path && real){
                                    io.emit(`progress`, {count: csvProgress, status: `Printing ${sam}`, SchemaName: schema.name, error: false});
                                    await printJob(job.id);
                                }
                            }
                        } catch (e) { error = String(e); }

                        totals[rule.type] = totals[rule.type] ? (totals[rule.type] + 1) : 1;
                        results.push( {
                            ...result,
                            sam,
                            job,
                            error,
                            schema: schema.name,
                            type: rule.type,
                            rule: {
                                name: rule.name,
                                description: rule.gen_pdf,
                                gen_pdf: rule.gen_pdf,
                                print: rule.print
                            },
                            dry: !real,
                            data,
                            matches: processed
                        } );
                        if (result.result.edustar_writeback && data._login) edustar_writeback.push({_login: data._login, _pass: result.result.edustar_writeback})
                    }
                }
                client.unbind();
                if (edustar_writeback.length >= 1 && real){
                    io.emit(`progress`, {count: schemaProgress, status: `riting Back To eduSTAR`, SchemaName: schema.name, error: false});
                    await edustar.update(edustar_writeback);
                }
            } catch (e) {
                if (ldap.connected && !ldap.unbound) ldap.unbind();
                console.log("Fatal error encountered on schema:", schema.name, e);
                errors.push({schema: schema.name, message:e.message})
                continue;
            }
        }
        const sorted = results.sort(dynamicSortMultiple("type", "sam"));
        res.json({sorted, errors});
        setProgress(100, "Done");
        io.emit(`totals`, totals);
    } catch (e) { err(e); }
}

export default function( route ) {
    route.post('/check', async (req, res, err) => run(res, err, req.body.real, req.body.SchemaName, req.body.RuleType, req.body.UserFilter) );
}