import { compile } from "../modules/handlebars.js";
import { Action, Condition, Rule, Schema } from "../typings/common.js";
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
import { server } from "../server.js";
import StmcUpload from "./operations/StmcUpload.js";
import { User } from "../modules/ldap.js";


export type actionProps = { action: Action, template: template, connections: connections, id: string, schema: Schema, execute: boolean, data: {[k: string]: string} };
interface template {[connector: string]: {[header: string]: string}}
interface connections { [k: string]: connection }
interface connection {
    rows: {[k: string]: string}[];
    keyed: {[k: string]: object};
    provider?: anyProvider;
    client?: unknown;
    close?: () => Promise<unknown>;
}

interface result {template?: boolean, success?: boolean, error?: string, warning?: string, data?: { [k:string]: string }}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type operation = (props: any) => Promise<result>;
const availableActions: { [k: string]: operation } = {
    //'Create User': createUser,
    //'Enable User': enableUser,
    //'Disable User': disableUser,
    //'Delete User': deleteUser,
    //'Move Organisational Unit': moveOU,
    //'Update Attributes': updateAtt,
    //'Update Groups': dirUpdateSec,
    //'Send To Printer': DocPrint,
    //'Write PDF': DocWritePDF,
    //'Write To File': FileWriteTxt,
    //'Delete File': FileDelete,
    //'Move File': FileMove,
    //'Copy File': FileCopy,
    //'Copy Folder': FolderCopy,
    //'Move Folder': FolderMove,
    //'Delete Folder': FolderDelete,
    //'Create Folder': FolderCreate,
    //'Template': SysTemplate,
    'Encrypt String': SysEncryptString,
    'Comparator': SysComparator,
    //'Upload Student Passwords': StmcUpload,
}

export async function connect(schema: Schema, connectorName: string, connections: connections, id: string): Promise<connection> {
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

async function actions(actions: Action[], template: template, connections: connections, id: string, schema: Schema, execute = false) {
    let template_ = template;
    const todo: {name: string, result: result }[] = [];
    for (const action of (actions||[])) {
        if (!(action.name in availableActions)) throw Error(`Unknown action '${action.name}'.`);
        const result = await availableActions[action.name]({ action, template, connections, execute, schema, id, data: {} });
        if (!result) continue;
        if (result.template) template_ = { ...template_, ...result.data as object  };
        todo.push({name: action.name, result });
    } return todo;
}


async function ldap_compare(key: string, value: string, operator: string, connections: connections, id: string ) {
    if (!(key in connections)) return false;
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
async function compare(key: string, value: string, operator: string, connections: connections, id: string): Promise<boolean> {
    if (operator.substring(0, 4)==="ldap") return ldap_compare(key, value, operator.substring(5), connections, id);
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

async function delimit(key: string, value: string, condition: Condition, connections: connections, id: string): Promise<boolean> {
    const delimited = value.split(condition.delimiter)
    for (const value of delimited) {
        if ( await compare(key, value, condition.operator, connections, id) ) return true;
    } return false;
}

async function evaluate(condition: Condition, template: template, connections: connections, id: string): Promise<boolean> {
    const key = compile(template, condition.key);
    const value = compile(template, condition.value);
    const delimiter = condition.delimiter !== "";
    return delimiter ? await delimit(key, value, condition, connections, id) : await compare(key, value, condition.operator, connections, id);
}

export async function evaluateAll(conditions: Condition[], template: template, connections: connections, id: string): Promise<boolean> {
    for (const condition of conditions) {
        if (!(await evaluate(condition, template, connections, id))) return false;
    } return true;
}

interface cur { time: number, index: number, performance: number }
function progress(cur: cur, length: number, id: string) {
    if (Math.abs(new Date().getTime() - cur.time) < 1) return;
    cur.time = (new Date()).getTime();
    const p = (cur.index / length)*100;
    server.io.emit("progress", { i: cur.index, p, m: length, s: cur.performance });
    server.io.emit("job_status", `Proccessing ${id}`);
}

const wait = async () => new Promise((res)=>setTimeout(res, 200));
export default async function process(schema: Schema , rule: Rule, idFilter?: string[]) {
    server.io.emit("job_status", `Search engine initialized`);
    server.io.emit("global_status", {schema: schema.name,  rule: rule.name, running: !!idFilter });
    const connections: connections = {};
    const primary = await connect(schema, rule.primary, connections, rule.primaryKey);
    if (idFilter) primary.rows = primary.rows.filter(p=>idFilter.includes(p[rule.primaryKey]));
    for (const secondary of rule.secondaries||[]){
        const key = secondary.secondaryKey.split(`${secondary.primary}.`)[1].split("}}")[0];
        await connect(schema, secondary.primary, connections, key);
    }
    const evaluated: { id: string, display?: string }[] = [];
    const cur: cur = {time: (new Date()).getTime()+1, index: 0, performance: 0 };
    for (const row of primary.rows) {
        const startTime = performance.now();
        cur.index ++;
        const id = row[rule.primaryKey];
        progress(cur, primary.rows.length, id);
        const template: template = { [rule.primary]: row };
        for (const secondary of rule.secondaries||[]) {
            if (!connections[secondary.primary]) continue;
            const joins = connections[secondary.primary].rows.filter(r=>{
                const k1 = compile({ [secondary.primary]: r }, secondary.secondaryKey);
                const k2 = compile(template, secondary.primaryKey);
                return k1===k2; //TODO - add toggle for case
            });//TODO - add option to ignore row if no join found
            template[secondary.primary] = (joins.length <=0 || joins.length > 1) ? {} : joins[0]; //TODO - add an option to grab first match, rather than ignore > 1
            const row: typeof evaluated[0] = { id };
            if (rule.display && rule.display.trim()!=='') row.display = compile(template, rule.display);
            if (!(await evaluateAll(rule.conditions, template, connections, id))) continue;
            const todo = await actions(rule.actions, template, connections, id, schema, !!idFilter);
            const actionable = todo.filter(t=>t.result.warning||t.result.error).length <= 0;
            console.log(actionable)
            // matches.push({id, display, actions: todo, actionable});
            evaluated.push(row);
        }
        await wait();
        cur.performance = performance.now() - startTime;
    }
    await conclude(connections);
    return {evaluated, initActions: [], finalActions: []};
}