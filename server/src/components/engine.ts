import { compile } from "../modules/handlebars.js";
import { Action, Condition, connections } from "../typings/common.js";
import connect from "./providers.js";
import { paths, server, history, testing } from "../server.js";
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
import { Doc } from "../db/models.js";
import winston from 'winston';
import fs from 'fs-extra';
import { FastifyInstance } from "fastify";
import dayjs from "dayjs";
import { xError } from "../modules/common.js";
import { Rule, Schema } from "./models.js";
import { schemas } from "../routes/schema.js";
import DirAccountControl from "./operations/DirAccountControl.js";
const { combine, timestamp, json } = winston.format;

interface sKeys { [k: string]: string }
interface template {[connector: string]: {[header: string]: string}|string|object}

interface result {template?: object, success?: boolean, error?: xError|string, warn?: string, data?: { [k:string]: string }}

export function getUser(action: Action & { target: string }, connections: connections, keys: sKeys, data: { [k:string]: string }): User {
    data.directory = action.target;
    if (!(action.target in connections)) throw Error(`Connector ${action.target} not found.`);
    const id = keys[action.target];
    if (!(id in connections[action.target].objects)) throw Error(`User ${id} not found in ${action.target}.`);
    return connections[action.target].objects[id] as User;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type operation = (props: any) => Promise<result>;
const availableActions: { [k: string]: operation } = {
    'Update Account Controls': DirAccountControl,
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

async function conclude(connections: connections, logger?: winston.Logger) {
    if (logger) logger.destroy();
    for (const connection of Object.values(connections)) {
        if (connection.close) await connection.close();
    }
    server.io.emit("job_status", "Idle");
    server.io.emit("global_status", {});
}

async function actions(actions: Action[], template: template, connections: connections, keys: sKeys, schema: Schema, execute = false) {
    const todo: {name: string, displayName?: string, result: result }[] = [];
    for (const action of (actions||[])) {
        if (!(action.name in availableActions)) throw Error(`Unknown action '${action.name}'.`);
        const result = await availableActions[action.name]({ action, template, connections, execute, schema, keys, data: {} });
        if (!result) continue;
        const name = action.displayName!==action.name ? { displayName: action.displayName||action.name } : {}
        todo.push({name: action.name, result, ...name });
        if (result.error){
            if ((result.error as xError).message) result.error = (result.error as xError).message;
            break;
        }
    } return {todo, template};
}

async function ldap_compare(key: string, value: string, operator: string, connections: connections, keys: sKeys ) {
    if (!(key in connections)) return false;
    const id = keys[key];
    const user: User|undefined = connections[key].objects[id] as User||undefined;
    switch (operator) {
        case 'exists': return !!user;
        case 'notexists': return !user;
        case 'enabled': return user && user.enabled();
        case 'disabled': return user && user.disabled();
        case 'member': return user && user.hasGroup(value);
        case 'notmember': return user && !user.hasGroup(value);
        case 'child': return user && user.childOf(value);
        case 'notchild': return user && !user.childOf(value);
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
        case 'file.exists': return fs.existsSync(key);
        case 'file.notexists': return !fs.existsSync(key);
        case 'date.==': return (dayjs(key).isSame(dayjs(value)));
        case 'date.!=': return !(dayjs(key).isSame(dayjs(value)));
        case 'date.>': return (dayjs(key).isAfter(dayjs(value)));
        case 'date.<': return (dayjs(key).isBefore(dayjs(value)));
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

interface cur { time: number, index: number, performance: number, startTime: number, progress: number }
function progress(cur: cur, length: number, id: string, start: number = 0) {
    if (Math.abs(new Date().getTime() - cur.time) < 100) return;
    cur.time = (new Date()).getTime();
    cur.performance = performance.now() - cur.startTime;
    const progress = start + ((cur.index / length)*(100 - start));
    const diff = progress - cur.progress;
    if (diff >= 1) server.io.emit("progress", { i: cur.index, p: progress, m: length, s: cur.performance, c: start !== 0  });
    server.io.emit("job_status", `Proccessing ${id}`);
    cur.progress = progress;
    cur.startTime = performance.now();
}

const wait = async (t = 100) => new Promise((res)=>setTimeout(res, t));
export const empty = (value?: string) => !value || value.trim()==='';
export default async function process(schema: Schema , rule: Rule, idFilter?: string[], scheduled?: boolean) {
    if (rule.test) idFilter = undefined;
    const connections: connections = {};
    let action: winston.Logger|undefined;
    try {
        history.debug({schema: schema.name, rule: rule.name, message: 'Running Rule.', scheduled});
        if (idFilter && rule.log && parseInt(rule.log) > 0 ) {
            if (rule.log==="1") history.info({schema: schema.name, rule: rule.name, message: 'Executing Rule.', scheduled});
            if (parseInt(rule.log) > 3){
                action = winston.createLogger({
                    level: 'info',
                    format: combine(timestamp(), json()),
                    transports: testing ? [ new winston.transports.Console({ silent: true })] :
                    new winston.transports.File({ filename: `${paths.journal}/${schema.name}.${rule.name}.${new Date().getTime()}.txt` }),
                });
            }
        } else { history.debug({schema: schema.name, rule: rule.name, message: 'Executing Rule.', scheduled}); }
        const cur: cur = {time: (new Date()).getTime()+1, index: 0, performance: 0, startTime: performance.now(), progress: 0 };
        progress(cur, 0, 'Search engine initialized');
        server.io.emit("global_status", {schema: schema.name,  rule: rule.name, running: !!idFilter });
        if (!rule.primaryKey) rule.primaryKey = 'id';
        let caseSen = false;
        for (const key of Object.keys(rule.config||{})){
            if (rule.config[key].case){ caseSen = true; break; }
        }
        const primary = await connect(schema, rule.primary, connections, rule.primaryKey, (rule.config||{})[rule.primary], caseSen);
        cur.index = 5;
        progress(cur, 100, 'secondaries');
        if (idFilter) primary.rows = primary.rows.filter(p=>(idFilter||[]).includes(p[rule.primaryKey]));
        await wait(500);
        for (const secondary of rule.secondaries||[]){
            if (empty(secondary.secondaryKey)) secondary.secondaryKey = rule.primaryKey;
            if (empty(secondary.primaryKey)) secondary.primaryKey = rule.primaryKey;
            await connect(schema, secondary.primary, connections, secondary.secondaryKey, rule.config[secondary.primary], secondary.case);
            await wait(500);
        }
        cur.index = 10;
        progress(cur, 100, 'init actions');
        await wait(500);
        const docsTemplate: template = { $file: {} };
        const docs = await Doc.findAll({where: { schema: schema.name }, raw: true });
        for (const doc of docs) {
            const path = `${paths.storage}/${schema.name}/${doc.id}${doc.ext?`.${doc.ext}`:''}`;
            (docsTemplate.$file as { [k: string]: string })[doc.name] = path;
        }
        const {todo: initActions, template: initTemplate } = await actions(rule.before_actions, docsTemplate, connections, {}, schema, !!idFilter);
        if (initActions.filter(r=>r.result.error).length>0){
            if (idFilter && action && rule.log==="4") action.error( { initAction: initActions.filter(r=>r.result.error)[0].result.error} )
            await conclude(connections); return {evaluated: [], initActions, finalActions: []};
        } else {
            if (idFilter && action && rule.log==="4" && initActions.length > 0) action.info( { initAction: `${initActions.length} initActions completed.` } );
        }
        cur.index = 15;
        progress(cur, 100, 'entries');
        await wait(50);
        const evaluated: { id: string, display?: string, actions: { name: string, result: result }[], actionable: boolean }[] = [];
        cur.index = 0;
        for (const row of primary.rows) {
            cur.index ++;
            const id = row[rule.primaryKey];
            progress(cur, primary.rows.length, id, 15);
            const template: template = { ...initTemplate, [rule.primary]: row, $index: String(cur.index) };
            let skip = false;
            const keys: sKeys = { [rule.primary]: caseSen?id:id.toLowerCase() };
            for (const secondary of rule.secondaries||[]) {
                const config = rule.config[secondary.primary]||{};
                if (!(secondary.primary in connections)) continue;
                const primaryKey = row[secondary.primaryKey];
                if (config.req && !primaryKey){ skip = true; break; }
                if (!primaryKey) continue;
                const secondaryJoin = connections[secondary.primary].keyed[config.case?primaryKey:primaryKey.toLowerCase()]||{};
                if (config.req && (!secondaryJoin || Object.keys(secondaryJoin).length<=0) ){ skip = true; break; }
                const joins = Object.keys(connections[secondary.primary].keyed).filter(k=>k===(config.case?primaryKey:primaryKey.toLowerCase()));
                if (config.req && joins.length <= 0){ skip = true; break; }
                if (config.oto && joins.length > 1){ skip = true; break; }
                template[secondary.primary] = secondaryJoin;
                keys[secondary.primary] = config.case?primaryKey:primaryKey.toLowerCase();
            } if (skip) continue;
            if (!(await evaluateAll(rule.conditions, template, connections, keys))) continue;
            const output: typeof evaluated[0] = { id, actions: [], actionable: false };
            if (!empty(rule.display)) output.display = compile(template, rule.display);
            output.actions = (await actions(rule.actions, template, connections, keys, schema, !!idFilter)).todo;
            output.actionable = output.actions.filter(t=>t.result.error).length <= 0;
            evaluated.push(output);
            if (idFilter && action && rule.log==="4"){
                const errors = output.actions.filter(t=>t.result.error).map(a=>a.result.error);
                const warnings = output.actions.filter(t=>t.result.warn).map(a=>a.result.warn);
                const log = errors.length > 0 ? action.error : (warnings.length > 0 ? action.warn : action.info);
                const message = errors.length > 0 ? errors[0] : (warnings.length > 0 ? warnings[0] : undefined);
                log({ id, index: cur.index, display: output.display||id, message });
            }
        }
        server.io.emit("job_status", `Evaluating final actions`);
        await wait(1000);
        const { todo: finalActions } = await actions(rule.after_actions, initTemplate, connections, {}, schema, !!idFilter);
        if (idFilter && action && rule.log==="4"){
            if (finalActions.filter(r=>r.result.error).length>0) {
                action.error( { finalAction: initActions.filter(r=>r.result.error)[0].result.error} )
            } else if (finalActions.length > 0) {
                action.info( { finalAction: `${finalActions.length} finalActions completed.` } );
            }
        }
        if (action) action.destroy();
        if (idFilter && rule.log && parseInt(rule.log) > 0 ) {
            if (rule.log==="2" || parseInt(rule.log) > 3) history.info({schema: schema.name, rule: rule.name, scheduled, message: 'Execution concluded.',
            initActions: initActions.length,
            finalActions: finalActions.length,
            executionCount: evaluated.length,
            successCount: evaluated.filter(e=>e.actionable).length,
            failureCount: evaluated.filter(e=>!e.actionable).length,
            warningCount: evaluated.filter(e=>e.actions.map(a=>a.result.warn).length>0).length,
            });
            if (rule.log==="3") history.info({schema: schema.name, rule: rule.name, scheduled, message: 'Execution concluded.',
            initActions: initActions.length,
            finalActions: finalActions.length,
            executionCount: evaluated.length,
            successes: evaluated.filter(e=>e.actionable).map(e=>e.id),
            failures: evaluated.filter(e=>!e.actionable).map(e=>e.id),
            warnings: evaluated.filter(e=>e.actions.map(a=>a.result.warn).length>0).map(e=>e.id),
            });
        } else { history.debug({schema: schema.name, rule: rule.name, message: 'Executing Rule.', scheduled}); }
        await conclude(connections, action);
        return {evaluated, initActions, finalActions};
    } catch (e) {
        const error = e as { schema: string, rule: string, scheduled?: boolean };
        error.schema = schema.name||'unknown';
        error.rule = rule.name||'unknown';
        error.scheduled = scheduled;
        if (!rule.test) history.error(error);
        conclude(connections, action);
        throw error;
    }
}

export async function processActions(schema: Schema , rule: Rule, limitTo: string[], scheduled?: boolean) {
    if (!limitTo || limitTo.length <= 0) throw (new xError("Unreviewed bulk actions not allowed"));
    if (rule.test) throw (new xError("Actions not allowed for tests"));
    return process(schema, rule, limitTo, scheduled );
}

export async function engine(route: FastifyInstance) {
    route.post('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const rule = request.body as Rule;
        try {
            const schema = schemas.get(schema_name);
            return await process( schema, rule );
        } catch (e) {  throw new xError(e).attach(e).send(reply); }
    });
    route.post('/execute', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const {limitTo, ...rule} = request.body as Rule;
        try {
            const schema = schemas.get(schema_name);
            return await processActions( schema, rule as Rule, (limitTo||[]) as string[] );
        } catch (e) { throw new xError(e).attach(e).send(reply); }
    });
}