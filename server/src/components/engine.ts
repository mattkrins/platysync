import { compile } from "../modules/handlebars.js";
import { Action, Condition, Rule, Schema, connections } from "../typings/common.js";
import connect from "./providers.js";
import { server } from "../server.js";
import { User } from "../modules/ldap.js";
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
import DirUpdateAtt from "./operations/DirUpdateAtt.js";
import DirMoveOU from "./operations/DirMoveOU.js";
import DirDeleteUser from "./operations/DirDeleteUser.js";
import DirDisableUser from "./operations/DirDisableUser.js";
import DirEnableUser from "./operations/DirEnableUser.js";
import DirCreateUser from "./operations/DirCreateUser.js";
import StmcUpload from "./operations/StmcUpload.js";

interface sKeys { [k: string]: string }
interface template {[connector: string]: {[header: string]: string}|string|object}

interface result {template?: object, success?: boolean, error?: string, warning?: string, data?: { [k:string]: string }}

export function getUser(action: Action & { target: string }, connections: connections, keys: sKeys, data: { [k:string]: string }): User {
    data.directory = action.target;
    if (!(action.target in connections)) throw Error(`Connector ${action.target} not found.`);
    const id = keys[action.target];
    if (!(id in connections[action.target].keyed)) throw Error(`User ${id} not found in ${action.target}.`);
    return connections[action.target].keyed[id] as User;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type operation = (props: any) => Promise<result>;
const availableActions: { [k: string]: operation } = {
    'Create User': DirCreateUser,
    'Delete User': DirDeleteUser,
    'Disable User': DirDisableUser,
    'Enable User': DirEnableUser,
    'Move Organisational Unit': DirMoveOU,
    'Update Attributes': DirUpdateAtt,
    'Update Groups': DirUpdateSec,
    'Send To Printer': DocPrint,
    'Write PDF': DocWritePDF,
    'Copy File': FileCopy,
    'Delete File': FileDelete,
    'Move File': FileMove,
    'Write To File': FileWriteTxt,
    'Copy Folder': FolderCopy,
    'Create Folder': FolderCreate,
    'Delete Folder': FolderDelete,
    'Move Folder': FolderMove,
    'Comparator': SysComparator,
    'Encrypt String': SysEncryptString,
    'Template': SysTemplate,
    'Upload Student Passwords': StmcUpload,
    //NOTE - Should work in theory, but not currently implemented due to arbitrary code execution vulnerability concerns:
    //LINK - server\src\components\operations\SysRunCommand.ts
    //'Run Command': SysRunCommand,
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
    const caseSen = rule.secondaries.filter(s=>s.case).length > 0;
    const primary = await connect(schema, rule.primary, connections, rule.primaryKey, caseSen);
    cur.index = 5;
    progress(cur, 100, 'secondaries');
    if (idFilter) primary.rows = primary.rows.filter(p=>idFilter.includes(p[rule.primaryKey]));
    await wait(500);
    for (const secondary of rule.secondaries||[]){
        if (empty(secondary.secondaryKey)) secondary.secondaryKey = rule.primaryKey;
        if (empty(secondary.primaryKey)) secondary.primaryKey = rule.primaryKey;
        await connect(schema, secondary.primary, connections, secondary.secondaryKey, secondary.case);
        await wait(500);
    }
    cur.index = 10;
    progress(cur, 100, 'init actions');
    await wait(500);
    const {todo: initActions, template: initTemplate } = await actions(rule.before_actions, {}, connections, {}, schema, !!idFilter);
    if (initActions.filter(r=>r.result.error).length>0){ await conclude(connections); return {evaluated: [], initActions, finalActions: []} }
    cur.index = 15;
    progress(cur, 100, 'entries');
    await wait(1000);
    const evaluated: { id: string, display?: string, actions: { name: string, result: result }[], actionable: boolean }[] = [];
    cur.index = 0;
    for (const row of primary.rows) {
        cur.index ++;
        const id = row[rule.primaryKey];
        progress(cur, primary.rows.length, id, 15);
        const template: template = { ...initTemplate, [rule.primary]: row };
        let skip = false;
        const keys: sKeys = { [rule.primary]: caseSen?id:id.toLowerCase() };
        for (const secondary of rule.secondaries||[]) {
            if (!(secondary.primary in connections)) continue;
            const primaryKey = row[secondary.primaryKey];
            if (secondary.req && !primaryKey){ skip = true; break; }
            if (!primaryKey) continue;
            const secondaryJoin = connections[secondary.primary].keyed[secondary.case?primaryKey:primaryKey.toLowerCase()]||{};
            if (secondary.req && !secondaryJoin){ skip = true; break; }
            const joins = Object.keys(connections[secondary.primary].keyed).filter(k=>k===(secondary.case?primaryKey:primaryKey.toLowerCase()));
            if (secondary.req && joins.length <= 0){ skip = true; break; }
            if (secondary.oto && joins.length > 1){ skip = true; break; }
            template[secondary.primary] = secondaryJoin;
            keys[secondary.primary] = secondary.case?primaryKey:primaryKey.toLowerCase();
        } if (skip) continue;
        //await wait(100);
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