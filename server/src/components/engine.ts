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

export type actionProps = { action: Action, template: template, connections: connections, schema: Schema, execute: boolean, conclude: boolean, data: {[k: string]: string} };
interface template {[connector: string]: {[header: string]: string}}
interface connections { [k: string]: connection }
interface connection {
    rows: {[k: string]: string}[];
    keys?: {[k: string]: object};
    provider?: anyProvider;
    client?: unknown;
    close?: () => Promise<unknown>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type operation = (props: any) => any;
const availableActions: { [k: string]: operation } = {
    //'Create User': createUser,
    //'Enable User': enableUser,
    //'Disable User': disableUser,
    //'Delete User': deleteUser,
    //'Move Organisational Unit': moveOU,
    //'Update Attributes': updateAtt,
    //'Update Groups': dirUpdateSec,
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
    'Encrypt String': SysEncryptString,
    'Comparator': SysComparator,
    'Upload Student Passwords': StmcUpload,
}

export async function connect(schema: Schema, connectorName: string, connections: connections): Promise<connection> {
    if (connections[connectorName]) return connections[connectorName];
    const provider = schema._connectors[connectorName] as anyProvider;
    server.io.emit("job_status", `Connecting to ${connectorName}`);
    let connection: connection = {rows:[], provider};
    switch (provider.id) {
        case 'csv': {
            const csv = new CSV(undefined, undefined, provider as CSVProvider );
            const data = await csv.open() as { data: {[k: string]: string}[] };
            connection = { rows: data.data, provider }; break;
        }
        case 'ldap': {
            const prov = provider as LDAPProvider;
            const ldap = new LDAP(prov);
            const client = await ldap.configure();
            const { users, keyed } = await client.search(ldap.attributes, (prov.filter && prov.filter.trim()!=='') ? prov.filter : undefined);
            const data = users.map(user=>user.plain_attributes);
            const close = async () => client.close();
            connection = { rows: data, keys: keyed, provider, close }; break;
        }
        default: throw Error("Unknown connector.");
    } connections[connectorName] = connection; return connection;
}

async function ldap_compare(schema: Schema, key: string, value: string, operator: string, connections: connections, id: string ) {
    //const user = (key in connections) && (id in connections[key].object) && connections[key].object[id];
    const connection = await connect(schema, key, connections);
    if (!connection.keys || !(id in connection.keys)) return false;
    const user = connection.keys[id] as User;
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

async function compare(schema: Schema, key: string, value: string, operator: string, connections: connections, id: string): Promise<boolean> {
    if (operator.substring(0, 4)==="ldap") return ldap_compare(schema, key, value, operator.substring(5), connections, id);
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

async function delimit(schema: Schema, key: string, value: string, condition: Condition, connections: connections, id: string): Promise<boolean> {
    const delimited = value.split(condition.delimiter)
    for (const value of delimited) {
        if ( await compare(schema, key, value, condition.operator, connections, id) ) return true;
    } return false;
}

async function evaluate(schema: Schema, condition: Condition, template: template, connections: connections, id: string): Promise<boolean> {
    const key = compile(template, condition.key);
    const value = compile(template, condition.value);
    const delimiter = condition.delimiter !== "";
    return delimiter ? await delimit(schema, key, value, condition, connections, id) : await compare(schema, key, value, condition.operator, connections, id);
}

export async function evaluateAll(schema: Schema, conditions: Condition[], template: template, connections: connections, id: string): Promise<boolean> {
    for (const condition of conditions) {
        if (!(await evaluate(schema, condition, template, connections, id))) return false;
    } return true;
}

async function actions(actions: Action[], template: template, connections: connections, schema: Schema, execute = false) {
    let template_ = template;
    const todo: {name: string, result: {error?: string, warning?: string, data?: object, success?: true } }[] = [];
    for (const action of (actions||[])) {
        if (!(action.name in availableActions)) throw Error(`Unknown action '${action.name}'.`);
        const result = await availableActions[action.name]({ action, template, connections, execute, schema, data: {} });
        if (!result) continue;
        if (result.template) template_ = { ...template_, ...result.data as object  };
        todo.push({name: action.name, result });
    } return todo;
}

async function conclude(connections: connections) {
    for (const connection of Object.values(connections)) {
        if (connection.close) await connection.close();
    }
    server.io.emit("job_status", "Idle");
    server.io.emit("global_status", {});
}

function calculateTimeRemaining(currentWork: number, totalWork: number, speed: number): string {
    if (speed <= 0)  return "Estimating...";
    const timeRemainingInSeconds: number = (totalWork - currentWork) / speed;
    const hours: number = Math.floor(timeRemainingInSeconds / 3600);
    const minutes: number = Math.floor((timeRemainingInSeconds % 3600) / 60);
    const seconds: number = Math.round(timeRemainingInSeconds % 60);
    const formattedTime: string = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return formattedTime;
}

let curTime = (new Date()).getTime();
function progress(i: number, length: number, id: string) {
    if (Math.abs(new Date().getTime() - curTime) > 1){
        const eta: string = calculateTimeRemaining(i, length, 100);
        const p = (i / length)*100;
        server.io.emit("progress", { eta, i, p, m: length });
        server.io.emit("job_status", `Proccessing ${id}`);
        curTime = (new Date()).getTime();
    }
}

export default async function process(schema: Schema , rule: Rule, idFilter?: string[]) {
    server.io.emit("job_status", `Search engine initialized`);
    server.io.emit("global_status", {schema: schema.name,  rule: rule.name, running: !!idFilter });
    const connections: connections = {};
    const primary = await connect(schema, rule.primary, connections);
    if (idFilter) primary.rows = primary.rows.filter(p=>idFilter.includes(p[rule.primaryKey]));
    for (const secondary of rule.secondaries||[]) await connect(schema, secondary.primary, connections);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matches: any[] = [];
    let i = 0;
    for (const row of primary.rows) {
        i++;
        const id = row[rule.primaryKey];
        progress(i, primary.rows.length, id);
        const template: template = { [rule.primary]: row };
        for (const secondary of rule.secondaries||[])  {
            const joins = connections[secondary.primary].rows.filter(r=>r[secondary.secondaryKey]===row[secondary.primaryKey]);
            template[secondary.primary] = (joins.length <=0 || joins.length > 1) ? {} : joins[0];
        }
        //TODO - allow searching per entry instead of preloading everything
        if (!(await evaluateAll(schema, rule.conditions, template, connections, rule.primaryKey))) continue;
        const display = (rule.display && rule.display.trim()!=='') ? compile(template, rule.display) : id;
        if (!display || display.trim()==='') continue;
        const todo = await actions(rule.actions, template, connections, schema, !!idFilter)
        const actionable = todo.filter(t=>t.result.warning||t.result.error).length <= 0;
        matches.push({id, display, actions: todo, actionable});
    }
    await conclude(connections);
    return {matches, initActions: [], finalActions: []};
}