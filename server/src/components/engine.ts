import { compile } from "../modules/handlebars.js";
import { Action, Condition, Rule, Schema, secondary } from "../typings/common.js";
import { anyProvider, CSV as CSVProvider, LDAP as LDAPProvider } from "../typings/providers.js";
import { CSV, LDAP } from "./providers.js";
import FileCopy from "./operations/FileCopy.js";
import SysComparator from "./operations/SysComparator.js";
import FileMove from "./operations/FileMove.js";
import FileDelete from "./operations/FileDelete.js";
import FileWriteTxt from "./operations/FileWriteTxt.js";
import DocWritePDF from "./operations/DocWritePDF.js";
import DocPrint from "./operations/DocPrint.js";
import FolderCopy from "./operations/FolderCopy.js";
import FolderMove from "./operations/FolderMove.js";
import FolderDelete from "./operations/FolderDelete.js";
import FolderCreate from "./operations/FolderCreate.js";
import SysTemplate from "./operations/SysTemplate.js";
import SysEncryptString from "./operations/SysEncryptString.js";
import DirUpdateSec from "./operations/DirUpdateSec.js";
import { server } from "../server.js";
import StmcUpload from "./operations/StmcUpload.js";
import { User } from "../modules/ldap.js";

interface sKeys { [k: string]: string }
export type actionProps = { action: Action, template: template, connections: connections, id: string, schema: Schema, execute: boolean, keys: sKeys, data: {[k: string]: string} };
interface template {[connector: string]: {[header: string]: string}|string}
interface connections { [k: string]: connection }
interface connection {
    rows: {[k: string]: string}[];
    keyed: {[k: string]: object};
    provider?: anyProvider;
    client?: unknown;
    close?: () => Promise<unknown>;
}

interface result {template?: object, success?: boolean, error?: string, warning?: string, data?: { [k:string]: string }}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type operation = (props: any) => Promise<result>;
const availableActions: { [k: string]: operation } = {
    //'Create User': createUser,
    //'Enable User': enableUser,
    //'Disable User': disableUser,
    //'Delete User': deleteUser,
    //'Move Organisational Unit': moveOU,
    //'Update Attributes': updateAtt,
    'Update Groups': DirUpdateSec,
    'Send To Printer': DocPrint,
    'Write PDF': DocWritePDF,
    'Write To File': FileWriteTxt,
    'Delete File': FileDelete,
    'Move File': FileMove,
    'Copy File': FileCopy,
    'Copy Folder': FolderCopy,
    'Move Folder': FolderMove,
    'Delete Folder': FolderDelete,
    'Create Folder': FolderCreate,
    'Template': SysTemplate,
    'Comparator': SysComparator,
    'Encrypt String': SysEncryptString,
    //'Upload Student Passwords': StmcUpload,
}

async function connect(schema: Schema, connectorName: string, connections: connections, id: string): Promise<connection> {
    if (connections[connectorName]) return connections[connectorName];
    const provider = schema._connectors[connectorName] as anyProvider;
    server.io.emit("job_status", `Connecting to ${connectorName}`);
    let connection: connection = {rows:[], keyed: {}, provider};
    switch (provider.id) {
        case 'csv': {
            const csv = new CSV(undefined, undefined, provider as CSVProvider );
            const data = await csv.open() as { data: {[k: string]: string}[] };
            const keyed: {[k: string]: object} = {}
            const rows = [];
            for (const row of data.data){
                if (keyed[row[id]]) continue; //REVIEW - skips non-unqiue rows; what should happen here? 
                keyed[row[id]] = row;
                rows.push(row);
            } data.data = [];
            connection = { rows, provider, keyed }; break;
        }
        case 'ldap': {
            const prov = provider as LDAPProvider;
            const ldap = new LDAP(prov);
            const client = await ldap.configure();
            //const { users, keyed } = await client.search(ldap.attributes, (prov.filter && prov.filter.trim()!=='') ? prov.filter : undefined);
            const { users, keyed } = await client.search(ldap.attributes, id);
            const close = async () => client.close();
            connection = { rows: users, keyed, provider, close }; break;
        }
        default: throw Error("Unknown connector.");
    } connections[connectorName] = connection; return connection;
}

async function conclude(connections: connections) {
    for (const connection of Object.values(connections)) {
        if (connection.close) await connection.close();
    }
    server.io.emit("job_status", "Idle");
    server.io.emit("global_status", {});
}

async function actions(actions: Action[], template: template, connections: connections, keys: sKeys, schema: Schema, execute = false) {
    const todo: {name: string, result: result }[] = [];
    for (const action of (actions||[])) {
        if (!(action.name in availableActions)) throw Error(`Unknown action '${action.name}'.`);
        const result = await availableActions[action.name]({ action, template, connections, execute, schema, keys, data: {} });
        if (!result) continue;
        todo.push({name: action.name, result });
        if (result.error) break;
    } return {todo, template};
}


async function ldap_compare(key: string, value: string, operator: string, connections: connections, keys: sKeys ) {
    if (!(key in connections)) return false;
    const id = keys[key];
    const user: User|undefined = connections[key].keyed[id] as User||undefined;
    switch (operator) {
        case 'exists': return !!user;
        case 'notexists': return !user;
        case 'enabled': return user && user.enabled();
        case 'disabled': return user && user.disabled();
        case 'member': return user && user.hasGroup(value);
        case 'notmember': return user && user.hasGroup(value);
        case 'child': return user && user.childOf(value);
        case 'notchild': return user && user.childOf(value);
        default: return false;
    }
}
async function compare(key: string, value: string, operator: string, connections: connections, keys: sKeys): Promise<boolean> {
    if (operator.substring(0, 4)==="ldap") return ldap_compare(key, value, operator.substring(5), connections, keys);
    switch (operator) {
        case '==': return key === value;
        case '!=': return key !== value;
        case '><': return key.includes(value);
        case '<>': return !key.includes(value);
        case '>*': return key.startsWith(value);
        case '*<': return key.endsWith(value);
        case '//': return (new RegExp(value, 'g')).test(key);
        case '===': return Number(key) === Number(value);
        case '!==': return Number(key) !== Number(value);
        case '>': return Number(key) > Number(value);
        case '<': return Number(key) < Number(value);
        case '>=': return Number(key) >= Number(value);
        case '<=': return Number(key) <= Number(value);
        default: return false;
    }
}

async function delimit(key: string, value: string, condition: Condition, connections: connections, keys: sKeys): Promise<boolean> {
    const delimited = value.split(condition.delimiter)
    for (const value of delimited) {
        if ( await compare(key, value, condition.operator, connections, keys) ) return true;
    } return false;
}

async function evaluate(condition: Condition, template: template, connections: connections, keys: sKeys): Promise<boolean> {
    const key = compile(template, condition.key);
    const value = compile(template, condition.value);
    const delimiter = condition.delimiter !== "";
    return delimiter ? await delimit(key, value, condition, connections, keys) : await compare(key, value, condition.operator, connections, keys);
}

export async function evaluateAll(conditions: Condition[], template: template, connections: connections, keys: sKeys): Promise<boolean> {
    for (const condition of conditions) {
        if (!(await evaluate(condition, template, connections, keys))) return false;
    } return true;
}

interface cur { time: number, index: number, performance: number, startTime: number }
function progress(cur: cur, length: number, id: string, start: number = 0) {
    if (Math.abs(new Date().getTime() - cur.time) < 100) return;
    cur.time = (new Date()).getTime();
    cur.performance = performance.now() - cur.startTime;
    const p = start + ((cur.index / length)*(100 - start));
    server.io.emit("progress", { i: cur.index, p, m: length, s: cur.performance, c: start !== 0  });
    server.io.emit("job_status", `Proccessing ${id}`);
    cur.startTime = performance.now();
}

const wait = async (t = 100) => new Promise((res)=>setTimeout(res, t));
export const empty = (value?: string) => !value || value.trim()==='';
export default async function process(schema: Schema , rule: Rule, idFilter?: string[]) {
    const cur: cur = {time: (new Date()).getTime()+1, index: 0, performance: 0, startTime: performance.now() };
    progress(cur, 0, 'Search engine initialized');
    server.io.emit("global_status", {schema: schema.name,  rule: rule.name, running: !!idFilter });
    const connections: connections = {};
    if (!rule.primaryKey) rule.primaryKey = 'id';
    const primary = await connect(schema, rule.primary, connections, rule.primaryKey);
    cur.index = 5;
    progress(cur, 100, 'secondaries');
    if (idFilter) primary.rows = primary.rows.filter(p=>idFilter.includes(p[rule.primaryKey]));
    await wait(500);
    for (const secondary of rule.secondaries||[]){
        if (empty(secondary.secondaryKey)) secondary.secondaryKey = `{{${secondary.primary}.${rule.primaryKey}}}`;
        if (empty(secondary.primaryKey)) secondary.primaryKey = `{{${rule.primary}.${rule.primaryKey}}}`;
        if (!secondary.secondaryKey.includes('{{')) throw Error(`Invalid key '${secondary.secondaryKey}' for joining ${secondary.primary} connector.`);
        if (!secondary.primaryKey.includes('{{')) throw Error(`Invalid key '${secondary.primaryKey}' for joining ${secondary.primary} connector.`);
        const key = secondary.secondaryKey.split(`${secondary.primary}.`)[1].split("}}")[0];
        await connect(schema, secondary.primary, connections, key);
    }
    cur.index = 10;
    progress(cur, 100, 'init actions');
    await wait(1000);
    const {todo: initActions, template: initTemplate } = await actions(rule.before_actions, {}, connections, {}, schema, !!idFilter);
    if (initActions.filter(r=>r.result.error).length>0){ await conclude(connections); return {evaluated: [], initActions, finalActions: []} }
    cur.index = 15;
    progress(cur, 100, 'init actions');
    await wait(1000);
    const evaluated: { id: string, display?: string, actions: { name: string, result: result }[], actionable: boolean }[] = [];
    cur.index = 0;
    for (const row of primary.rows) {
        cur.index ++;
        const id = row[rule.primaryKey];
        progress(cur, primary.rows.length, id, 15);
        const template: template = { ...initTemplate, [rule.primary]: row };
        let skip = false;
        const keys: sKeys = {};
        for (const secondary of rule.secondaries||[]) {
            if (!connections[secondary.primary]) continue;
            let s = 0;
            for (const r of connections[secondary.primary].rows||[]) {
                const k1 = compile({ [secondary.primary]: r }, secondary.secondaryKey);
                const k2 = compile(template, secondary.primaryKey);
                if (secondary.case?k1.toLowerCase()===k2.toLowerCase():k1===k2){
                    keys[secondary.primary] = k1;
                    s++; template[secondary.primary] = r; if (secondary.oto){ break; }
                }
            } if (!template[secondary.primary]) template[secondary.primary] = {};
            if (secondary.req && Object.keys(template[secondary.primary]).length===0) skip = true;
            if (secondary.oto && s>1) skip = true;
        } if (skip) continue;
        await wait(100);
        if (!(await evaluateAll(rule.conditions, template, connections, keys))) continue;
        const output: typeof evaluated[0] = { id, actions: [], actionable: false };
        if (!empty(rule.display)) output.display = compile(template, rule.display);
        output.actions = (await actions(rule.actions, template, connections, keys, schema, !!idFilter)).todo;
        output.actionable = output.actions.filter(t=>t.result.error).length <= 0;
        evaluated.push(output);
    }
    server.io.emit("job_status", `Evaluating final actions`);
    await wait(1000);
    const {todo: finalActions } = await actions(rule.after_actions, initTemplate, connections, {}, schema, !!idFilter);
    await conclude(connections);
    return {evaluated, initActions, finalActions};
}