/* eslint-disable @typescript-eslint/no-explicit-any */
import { Condition, Rule, Schema, Action, secondary } from "../typings/common.js";
import { CSV, STMC } from "./providers.js";
import { anyProvider } from "../typings/providers.js";
import ldap, { User } from "../modules/ldap.js";
import { Hash, decrypt } from "../modules/cryptography.js";
import Handlebars from "handlebars";
import createUser from "./actions/DirCreateUser.js";
import enableUser from "./actions/DirEnableUser.js";
import writePDF from "./actions/DocWritePDF.js";
import sendToPrinter from "./actions/DocSendToPrinter.js";
import templateData from "./actions/SysTemplate.js";
import { server } from "../server.js";
import disableUser from "./actions/DirDisableUser.js";
import deleteFile from "./actions/FileDelete.js";
import moveFile from "./actions/FileMove.js";
import copyFile from "./actions/FileCopy.js";
import copyFolder from "./actions/FolderCopy.js";
import moveFolder from "./actions/FolderMove.js";
import deleteFolder from "./actions/FolderDelete.js";
import deleteUser from "./actions/DirDeleteUser.js";
import moveOU from "./actions/DirMoveOU.js";
import updateAtt from "./actions/DirUpdateAtt.js";
import fileWriteTxt from "./actions/FileWriteTxt.js";

interface primaryResponse {
    rows: {[k: string]: string}[];
    client?: unknown;
    connector: anyProvider;
    object: {[k: string]: User};
}

interface secondaryResponse extends secondary, primaryResponse {}

export interface connections {[name: string]: primaryResponse | secondaryResponse}

export type FileHandles = {[handle: string]: {type:'fileStream', handle:any}}

interface template {[connector: string]: {[header: string]: string}}

async function getRows(connector: anyProvider, schema_name: string, attribute?: string): Promise<primaryResponse>  {
    switch (connector.id) {
        case 'stmc': { //FIXME - io.emit stops working in the STMC connector. No idea why.
            const stmc = new STMC(schema_name, connector.school, connector.proxy, connector.eduhub);
            const client = await stmc.configure();
            const password = await decrypt(connector.password as Hash);
            server.io.emit("job_status", "Logging into STMC");
            await client.login(connector.username, password);
            server.io.emit("job_status", "Downloading STMC data");
            let users = await client.getUsers();
            if (connector.eduhub){
                server.io.emit("job_status", "Matching eduhub data");
                users = client.bindEduhub();
            }
            return { rows: users, connector, object: {} };
        }
        case 'csv': {
            const csv = new CSV(connector.path);
            const data = await csv.open() as { data: {[k: string]: string}[] };
            return { rows: data.data, connector, object: {} };
        }
        case 'ldap': {
            const client = new ldap();
            server.io.emit("job_status", `Connecting to: ${connector.url}`);
            await client.connect(connector.url);
            const password = await decrypt(connector.password as Hash);
            server.io.emit("job_status", `Logging into: ${connector.url}`);
            await client.login(connector.username, password);
            let base = connector.dse || await client.getRoot();
            if ((connector.base||'')!=='') base = `${connector.base},${base}`;
            client.base = base;
            const mustHave = ['sAMAccountName', 'userPrincipalName', 'cn', 'uid', 'distinguishedName', 'userAccountControl', 'memberOf'];
            let attributes: string[] = [];
            if (connector.attributes.length>0) {
                attributes = connector.attributes;
                for (const a of mustHave) if (!attributes.includes(a)) attributes.push(a);
            }
            server.io.emit("job_status", `Loading users`);
            const { array, object } = await client.getUsers(attributes, attribute);
            return { rows: array, client, connector, object }
        }
        default: throw Error("Unknown connector.");
    }
}

async function match(operator: string, key: string, value: string, connections: connections, id: string){
    const user = (key in connections) && (id in connections[key].object) && connections[key].object[id];
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

async function matchDelimited(key: string, value: string, condition: Condition, connections: connections, id: string) {
    const delimited = value.split(condition.delimiter)
    for (const value of delimited) {
        if ( await match(condition.operator, key, value, connections, id) ) return true;
    } return false;
}

async function matchCondition(condition: Condition, template: template, connections: connections, id: string) {
    const key = Handlebars.compile(condition.key)(template);
    const value = Handlebars.compile(condition.value)(template);
    const delimiter = condition.delimiter !== "";
    return delimiter ? await matchDelimited(key, value, condition, connections, id) : await match(condition.operator, key, value, connections, id);
}

async function matchedAllConditions(conditions: Condition[], template: template, connections: connections, id: string ){
    for (const condition of conditions) {
        if (!(await matchCondition(condition, template, connections, id))) return false;
    } return true;
}

const actionMap: {
    [name: string]: (execute: boolean|undefined, act: Action, template: template, connections: connections, fileHandles: FileHandles, close: boolean  ) =>
    Promise<{ error?: string; warning?: string; data?: unknown, template?: boolean }> } ={
    'Create User': createUser,
    'Enable User': enableUser,
    'Disable User': disableUser,
    'Delete User': deleteUser,
    'Move Organisational Unit': moveOU,
    'Update Attributes': updateAtt,
    'Write PDF': writePDF,
    'Send To Printer': sendToPrinter,
    'Write To File': fileWriteTxt,
    'Delete File': deleteFile,
    'Move File': moveFile,
    'Copy File': copyFile,
    'Copy Folder': copyFolder,
    'Move Folder': moveFolder,
    'Delete Folder': deleteFolder,
    'Template': templateData,
    //NOTE - Should work in theory, but not currently implemented due to arbitrary code execution vulnerability concerns:
    //LINK - server\src\components\actions\SysRunCommand.tsx
    // 'Run Command': runCommand,
    //REVIEW - add icacls? might also be vulnerable. https://4sysops.com/archives/icacls-list-set-grant-remove-and-deny-permissions/
}

async function getActions(actions: Action[], connections: connections, template: template, fileHandles: FileHandles, execute = false, close = false){
    const todo: {name: string, result: {error?: string, warning?: string } }[] = [];
    let _template = template;
    for (const action of (actions||[])) {
        if (!(action.name in actionMap)) continue;
        const result = await actionMap[action.name](execute, action, _template, connections, fileHandles, close );
        if (result.template && result.data){ _template = { ..._template, ...result.data as object }; }
        todo.push({name: action.name, result });
        if (result.error || result.warning) return {todo, _template};
    } return {todo, _template};
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
export default async function findMatches(schema: Schema , rule: Rule, limitTo?: string[]) {
    server.io.emit("global_status", {schema: schema.name,  rule: rule.name, running: !!limitTo });
    server.io.emit("job_status", "Loading Primary");
    const primaryConnector = schema._connectors[rule.primary] as anyProvider;
    const primary = await getRows(primaryConnector, schema.name, rule.primaryKey);
    server.io.emit("job_status", "Loading Secondaries");
    const secondaries: {[name: string]: secondaryResponse} = {};
    for (const secondary of rule.secondaries||[]) {
        const rows = await getRows(schema._connectors[secondary.primary] as anyProvider, schema.name, secondary.secondaryKey);
        secondaries[secondary.primary] = {...rows, ...secondary};
    }
    const matches: any[] = [];
    let i = 0;
    if (limitTo) primary.rows = primary.rows.filter(p=>limitTo.includes(p[rule.primaryKey]));
    const fileHandles: FileHandles = {};
    const connections = { ...secondaries, [rule.primary]: primary  };
    if ((rule.before_actions||[]).length>0) server.io.emit("job_status", `${!limitTo?'Checking':'Running'} Init Actions`);
    const { todo: initActions, _template: initTemplate } = await getActions(rule.before_actions, connections, {}, fileHandles, !!limitTo);
    const initErrors = initActions.filter(r=>r.result.error);
    if (initErrors.length > 0){
        server.io.emit("job_status", "Idle");
        server.io.emit("global_status", {});
        return {matches, initActions};
    }
    server.io.emit("job_status", "Matching Data");
    for (const object of primary.rows) {
        const id = object[rule.primaryKey];
        i++;
        if (Math.abs(new Date().getTime() - curTime) > 1){
            const eta: string = calculateTimeRemaining(i, primary.rows.length, 100);
            const p = (i / primary.rows.length)*100;
            server.io.emit("progress", { eta, i, p, m: primary.rows.length });
            server.io.emit("job_status", `Proccessing ${id}`);
            curTime = (new Date()).getTime();
        }
        const template: template = {...initTemplate};
        template[`${rule.primary}`] = object;
        for (const name of Object.keys(secondaries)) {
            const secondary = secondaries[name];
            let found: {[k: string]: string}|undefined;
            for (const row of secondary.rows) {
            if (row[secondary.secondaryKey]===object[secondary.primaryKey]) found = row;
            } if (!found) continue;
            template[`${name}`] = found||{};
        }
        if (!(await matchedAllConditions(rule.conditions, template, connections, id))) continue;
        const display = (rule.display && rule.display!=='') ? Handlebars.compile(rule.display)(template) : id;
        const { todo } = await getActions(rule.actions, connections, template, fileHandles, !!limitTo);
        const actionable = todo.filter(t=>t.result.warning||t.result.error).length <= 0;
        matches.push({id, display, actions: todo, actionable});
    }
    if ((rule.after_actions||[]).length>0) server.io.emit("job_status", `${!limitTo?'Checking':'Running'} Final Actions`);
    const { todo: finalActions } = await getActions(rule.after_actions, connections, initTemplate, fileHandles, !!limitTo, true);
    
    for (const file of Object.values(fileHandles)) {
        if (file.type==="fileStream") file.handle.close();
    }

    server.io.emit("job_status", "Idle");
    server.io.emit("global_status", {});
    return {matches, initActions, finalActions};
}

export async function runActionFor(schema: Schema , rule: Rule, limitTo: string[]) {
    if (!limitTo || limitTo.length <= 0) throw (Error("Unreviewed bulk actions not allowed"));
    return findMatches(schema, rule, limitTo );
}