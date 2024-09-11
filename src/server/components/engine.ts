import { paths, history } from "../..";
import { server } from '../server';
import { notCaseSen, ThrottledQueue, wait, xError } from "../modules/common";
import { compile } from "../modules/handlebars";
import { availableActions, handles } from "./actions";
import { addContext, connect, connections, contexts } from "./providers";
import { v4 as uuidv4 } from 'uuid';
import dayjs from "dayjs";
import fs from 'fs-extra';
import LDAP from "./providers/LDAP";
import { defaultData, Settings } from "./database";
import { configs } from "./configs/base";
import { ldapAttributeUpdate } from "./actions/LdapUpdateAttributes";

export class Engine { //TODO - add way to cancel
    public id: string;
    private settings: Settings = defaultData.settings;
    private connections: connections = {};
    private handles: handles = {};
    private contexts:  contexts = {};
    private configs:  configs = {};
    private status: jobStatus;
    private queue = new ThrottledQueue(10);
    private rule: Rule;
    private schema: Schema;
    private filter?:  string[];
    private scheduled?: boolean;
    private primary?: string;
    private executing: boolean;
    private sources: Source[];
    private initTemplate: template = {};
    private primaryResults: primaryResult[] = [];
    private columns: string[] = [];
    private progress = 0;
    private hasInit = false;
    private hasFinal = false;
    private testing = false;
    private display = "Display";
    constructor(rule: Rule, schema: Schema, filter?:  string[], scheduled?: boolean, testing?: boolean) {
        this.id = uuidv4();
        this.rule = rule;
        this.schema = schema;
        this.scheduled = scheduled;
        this.filter = filter;
        this.executing = !!filter||false;
        this.testing = testing||false;
        this.primary = this.rule.primary;
        this.sources = this.rule.sources||[];
        this.hasInit = this.rule.initActions.length > 0;
        this.hasFinal = this.rule.finalActions.length > 0;
        this.display = this.rule.displayKey || "Display";
        this.status = {
            eta: false, text: "Initialising...",
            progress: { total: 0, init: false, connect: false, iterative: false, final: false },
            iteration: { current: 0, total: false },
        };
    }
    public getRule() { return this.rule }
    public getColumns() { return this.columns }
    public getPrimaryResults() { return this.primaryResults }
    public async Run(): Promise<response> {
        if (!this.testing){
            history.info({
                schema: this.schema.name,
                rule: this.rule.name,
                message: `Rule ${this.executing?'executing':'evaluating'}.`,
                scheduled: this.scheduled,
                executing: this.executing,
                id: this.id
            });
        }
        this.settings = await Settings();
        this.columns = [this.display, ...this.rule.columns.filter(c=>c.name).map(c=>c.name)];
        this.Emit();
        const docsTemplate: template = { $file: {} };
        for (const file of this.schema.files) {
            const folder = `${paths.storage}/${this.schema.name}`;
            const path = `${folder}/${file.path}`;
            (docsTemplate.$file as { [k: string]: string })[file.key||file.name] = path;
        }
        await this.connect();
        const { todo: initActions, template: initTemplate, error: initError } = await this.processActions(this.rule.initActions, docsTemplate, "init");
        if (this.hasInit) this.progress = 15;
        this.initTemplate = initTemplate;
        if (initError) throw initError;
        //FIXME - fix progress for contexts
        for (const context of (this.rule.contexts||[])) await addContext(this.schema, context, this.contexts );
        if (this.primary) this.progress = this.hasInit ? 35 : 20;
        if (!this.primary) this.progress = 50;
        await wait(500);
        await this.iteratePrimary();
        if (this.primary) this.progress = 85;
        const { todo: finalActions } = await this.processActions(this.rule.finalActions, initTemplate, "final");
        this.Emit({ text: "Finalising..." });
        await wait(500);
        await this.conclude();
        this.Emit({ progress: { total: 100 }, eta: "Complete", text: "Complete"});
        const response: response = { primaryResults: this.primaryResults, initActions, finalActions, columns: this.columns, id: this.rule.idName };
        if (this.executing) await this.safeLog(response);
        return response;
    }
    private async safeLog(response: response){
        if (!this.rule.log) {
            history.info({
                schema: this.schema.name,
                rule: this.rule.name,
                message: "Rule concluded.",
            });
            return;
        }
        const copy = JSON.parse(JSON.stringify(response)) as response;
        const settings = await Settings();
        const redacted = (settings.redact||[]).map(r=>r.toLowerCase());
        const santitize = (actions: actionResult[]): actionResult[] => actions.map(action=>{
            switch (action.name) {
                case "SysEncryptString": {
                    (action.result.data as Record<string,string>).secret = "-REDACTED-";
                    (action.result.data as Record<string,string>).password = "-REDACTED-";
                    (action.result.data as Record<string,string>).key = "-REDACTED-";
                    break;
                }
                case "SysTemplate": {
                    if (redacted.includes((action.result.data as Record<string,string>).key)) {
                        (action.result.data as Record<string,string>).value = "-REDACTED-";
                    }
                    break;
                }
                case "LdapUpdateAttributes": {
                    if ((action.result.data as Record<string,ldapAttributeUpdate[]>).changes) {
                        for (const change of ((action.result.data as Record<string,ldapAttributeUpdate[]>).changes||[])) {
                            if (redacted.includes(change.name.toLowerCase())) change.value = "-REDACTED-";
                        }
                    }
                    break;
                }
                default: {
                    for (const key of (Object.keys(action.result.data as Record<string,string>))) {
                        if (redacted.includes(key.toLowerCase())) (action.result.data as Record<string,string>)[key] = "-REDACTED-";
                    }
                    break;
                }
            }
            return action;
        });
        const initActions = santitize(copy.initActions);
        const finalActions = santitize(copy.finalActions);
        const primaryResults = copy.primaryResults.map(({actions, ...r})=>({...r, actions: santitize(actions) }))
        const safe: response = { ...copy, initActions, finalActions, primaryResults };
        history.info({
            schema: this.schema.name,
            rule: this.rule.name,
            message: "Rule concluded.",
            results: safe,
        });
    }
    private async conclude(){
        for (const key of Object.keys(this.handles)) {
            const handle = this.handles[key];
            if (handle.close) await handle.close();
        }
    }
    public async ldap_getUser(key: string, template: template, id?: string, userFilter?: string, compiledFilter?: string) {
        if (!id) return false;
        const ldap = this.connections[key] as LDAP|undefined;
        if (ldap && ldap.users[id]) return ldap.users[id];
        const context = this.contexts[key] as LDAP|undefined;
        if (!context) return false;
        const user = await context.getUser(template, id, userFilter, compiledFilter);
        return user || false;
    }
    private async ldap_compare(key: string, value: string, operator: string, template: template, id?: string ) {
        if (!key || !id) return false;
        const user = await this.ldap_getUser(key, template, id);
        if (operator==="notexists") return !user;
        if (!user) return false;
        switch (operator) {
            case 'exists': return true;
            case 'enabled': return user && user.enabled();
            case 'disabled': return user && user.disabled();
            case 'member': return user && user.hasGroup(value);
            case 'notmember': return user && !user.hasGroup(value);
            case 'child': return user && user.childOf(value);
            case 'notchild': return user && !user.childOf(value);
            default: return false;
        }
    }
    private async compare(key: string, value: string, operator: string, template: template, id?: string): Promise<boolean> {
        if (operator.substring(0, 4)==="ldap") return await this.ldap_compare(key, value, operator.substring(5), template, id);
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
    private async delimit(key: string, value: string, condition: Condition, template: template, id?: string): Promise<boolean> {
        const delimited = value.split(condition.delimiter as string);
        for (const value of delimited) {
            const result = await this.compare(key, value, condition.operator, template, id);
            if (!condition.and && result) return true;
            if (condition.and && !result) return false;
        } return condition.and||false;
    }
    private async evaluate(condition: Condition, template: template, id?: string): Promise<boolean> {
        const key = compile(template, condition.key);
        const value = compile(template, condition.value);
        const k = condition.case ? key.toLocaleLowerCase() : key;
        const v = condition.case ? value.toLocaleLowerCase() : value;
        const delimiter = condition.delimiter !== "";
        return delimiter ? await this.delimit(k, v, condition, template, id) : await this.compare(k, v, condition.operator, template, id);
    }
    public async evaluateAll(conditions: Condition[], template: template, id?: string): Promise<boolean> {
        for (const condition of conditions) {
            if (!(await this.evaluate(condition, template, id))) return false;
        } return true;
    }
    private async connect(){
        if (!this.primary) return;
        const connectStart = new Date().getTime();
        let i = 1;
        const x = () => (20/(this.sources.length+1))*i;
        this.Emit({ iteration: { total: this.sources.length+1, current: 0 }, });
        await connect(this.schema, this.primary, this.connections, this, this.rule.primaryKey);
        history.debug({schema: this.schema.name, rule: this.rule.name, message: `Primary: ${this.primary} connected.` });
        this.Emit({
            progress: { total: this.progress + x(), connect: x() },
            iteration: { current: 1 },
        });
        for (const source of this.sources) {  i++;
            await connect(this.schema, source.foreignName, this.connections, this, source.foreignKey);
            history.debug({schema: this.schema.name, rule: this.rule.name, message: `Secondary: ${source.foreignName} connected.` });
            //TODO - add condition filter to add source GUI, run evaluateAll against connector data to filter on a source basis and speed up later joins
            this.Emit({
                progress: { total: this.progress + x(), connect: x() },
                iteration: { current: i },
            });
        }
        await wait(1000, connectStart);
        await wait(200);
        this.Emit({ iteration: { total: false, current: 0 }, text: "Preparing..." });
    }
    private async iteratePrimary(){
        if (!this.primary) return;
        const start = new Date().getTime();
        const primary = this.connections[this.primary];
        let p = 0;
        let i = 0;
        let speed = 0;
        let eta = "Estimating...";
        let lastCalc = 0;
        let iterativeLength = 80;
        if (this.hasInit) iterativeLength -= 15;
        if (this.hasFinal) iterativeLength -= 15;
        const entries = this.connections[this.primary].data;
        const entryCount = entries.length;
        this.Emit({ iteration: { total: entryCount } });
        const etas: number[] = [];
        function calculateTimeRemaining(currentWork: number, totalWork: number, speed: number, eta?: number): [string, number] {
            const timeRemainingInSeconds: number = eta || ((totalWork - currentWork) * speed) / 1000;
            const hours: number = Math.floor(timeRemainingInSeconds / 3600);
            const minutes: number = Math.floor((timeRemainingInSeconds % 3600) / 60);
            const seconds: number = Math.round(timeRemainingInSeconds % 60);
            const formattedTime: string = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            return [ formattedTime, timeRemainingInSeconds ];
        }
        const emit = (start: number, id: string) => {
            if (lastCalc - (new Date().getTime()) <= 0){
                lastCalc = start+1000;
                const [ _, t ] = calculateTimeRemaining(i, entryCount, speed===0?10:speed );
                if (etas.length >= 5) etas.shift();
                etas.push(t);
                const totalMilliseconds = etas.reduce((acc, t) => acc + t, 0);
                const averageMilliseconds = totalMilliseconds / etas.length;
                const [ remaining ] = calculateTimeRemaining(0, 0, 0, averageMilliseconds );
                eta = remaining;
            }
            const x = (i/entryCount) * iterativeLength;
            const r = Math.round((x + Number.EPSILON) * 10) / 10;
            if (r!=p) { p = r; this.queue.run(()=>this.Emit({
                progress: { iterative: x, total: this.progress + x },
                iteration: { current: i }, eta, text: id
            })); }
            speed = new Date().getTime() - start;
        }
        for (const record of entries) { i++;
            const start = new Date().getTime();
            const id = record[this.rule.primaryKey||primary.headers[0]];
            if (!id) continue;
            if (this.filter && !this.filter.includes(id)) continue;
            const joined = this.Join(record);
            if (!joined) continue;
            const template: template = { ...this.initTemplate, ...joined };
            if (this.rule.conditions.length > 0 && (!this.filter || this.filter.length <= 0)) {
                if (!(await this.evaluateAll(this.rule.conditions, template, id))) continue;
            }
            const {todo: iterativeActions, error: iterativeError, warn: iterativeWarn } = await this.processActions(this.rule.iterativeActions, template, "iterative", id);
            const display = this.rule.display ? compile(template, this.rule.display) : id;
            const output: primaryResult = { id, actions: [], error: false, columns: [ { name: this.display, value: display } ] };
            output.actions = iterativeActions;
            output.error = !!iterativeError;
            output.warn = !!iterativeWarn;
            for (const column of this.rule.columns){
                if (!column.name || !column.value) continue;
                output.columns.push({ name: column.name, value: compile(template, column.value) });
            }
            this.primaryResults.push(output);
            emit(start, id);
        }
        await wait(2000, start);
        this.queue.clear();
        await wait(500);
        this.Emit({
            eta: "Finalising...", text: "Finalising...",
            iteration: { total: false, current: 0 },
            progress: { total: this.progress + iterativeLength, iterative: iterativeLength }
        });
    }
    private async processActions(actions: Action[], template: template, type: string, id?: string) {
        const start = new Date().getTime();
        const todo: actionResult[] = [];
        let error: undefined|xError;
        let warn: undefined|string;
        let i = 0;
        if (type!=="iterative" && actions.length > 0){
            this.Emit({ text: `Processing ${type} actions...` });
            this.Emit({ iteration: { total: (actions||[]).length } });
        }
        const length = this.primary ? 15 : this.hasFinal ? (this.hasInit ? 50 : 100) : this.hasFinal ? 50 : 100;
        const emit = () => {
            if (type==="iterative") return;
            const x = (length/(actions.length))*i;
            const total = this.progress + x;
            this.Emit({ progress: { total, [type]: x }, iteration: { current: i } });
        }
        for (const action of (actions||[])) { i++;
            if (!action.enabled){ emit(); continue; }
            if (!(action.name in availableActions)) throw new xError(`Unknown action '${action.name}'.`);
            const result = await availableActions[action.name]({
                action, template, connections: this.connections,
                handles: this.handles, execute: this.executing,
                engine: this, data: {}, id, settings: this.settings,
                contexts: this.contexts, configs: this.configs, schema: this.schema
            })
            if (!result)  throw new xError(`Failed to run action '${action.name}'.`);
            const name = (action.display && action.display!==action.name) ? { display: action.display||action.name } : {}
            todo.push({name: action.name, result, ...name, noblock: action.noblock });
            if (result.warn) warn = result.warn;
            if (result.error){
                if ((result.error as xError).message) result.error = (result.error as xError).message;
                if (!action.noblock){
                    error = new xError(result.error, action.name);
                    break;
                }
                result.warn = result.error.toString();
                warn = result.warn;
                delete result.error;
            }
            emit();
        }
        if (type!=="iterative"){
            await wait(1000, start);
            this.Emit({ iteration: { total: false, current: 0 } });
        }
        return {todo, template, error, warn};
    }
    private Join(record: Record<string, string>): template|false {
        const joined: template = { [this.primary as string]: record };
        for (const source of this.sources) {
            if (!joined[source.primaryName] || !this.connections[source.foreignName]) continue;
            const primary = joined[source.primaryName];
            const foreignHeaders = this.connections[source.foreignName].headers;
            const primaryHeaders = this.connections[source.primaryName].headers;
            const foreignKey = source.foreignKey || foreignHeaders[0];
            const primaryKey = source.primaryKey || primaryHeaders[0];
            const foreignData = this.connections[source.foreignName].data;
            if (!foreignKey || !primaryKey || !primary[primaryKey]) continue;
            const foreignRecord = foreignData.find( foreign => {
                if (!foreign[foreignKey]) return false;
                if (source.inCase) return notCaseSen.compare(foreign[foreignKey], primary[primaryKey]) === 0;
                return foreign[foreignKey] === primary[primaryKey];
            } )
            if (source.require&&!foreignRecord) return false;
            joined[source.foreignName] = foreignRecord || {};
        } return joined;
    }
    public Emit(update?: DeepPartial<jobStatus>, id?: string) {
        this.status = { ...this.status,
            eta: update?.eta||this.status.eta, text: update?.text||this.status.text,
            progress: {...this.status.progress,  ...update?.progress},
            iteration: {...this.status.iteration, ...update?.iteration}
        };
        server.io.emit("job_status", this.status);
    }
}

export default async function evaluate(rule: Rule, schema: Schema, filter?:  string[], scheduled?: boolean, testing?: boolean ): Promise<response> {
    try {
        const engine = new Engine(rule, schema, filter, scheduled, testing);
        return await engine.Run();
    } catch (e) {
        const error = e as { schema: string, rule: string, scheduled?: boolean, message: string };
        history.error({schema: schema.name, message: error.message || JSON.stringify(e), rule: rule.name, scheduled });
        throw error.message;
    }
}

