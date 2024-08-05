import { server } from "../../server";
import { ThrottledQueue, wait, xError } from "../modules/common";
import { compile } from "../modules/handlebars";
import { availableActions } from "./actions";
import { connect, connections } from "./providers";
import { v4 as uuidv4 } from 'uuid';

class Engine {
    public id: string;
    private connections: connections = {};
    private status: jobStatus;
    private queue = new ThrottledQueue(10);
    private rule;
    private schema;
    private context?:  string[];
    private scheduled?: boolean;
    private primary?: string;
    private sources: Source[];
    private execute: boolean;
    private initTemplate: template = {};
    private primaryResults: primaryResult[] = [];
    private hasInitActions: boolean;
    private hasFinalActions: boolean;
    private iterativeTotal = 0;
    private initIteration = 0;
    private connectionIteration = 0;
    private iterativeIteration = 0;
    private finalIteration = 0;
    private padding = 0;
    calcLengths() {
        const init = !this.hasInitActions ? 0 : ((15/(this.rule.initActions.length))*this.initIteration);
        const connect = Object.keys(this.connections).length<=0 ? 0 : ((20/(this.sources.length+1))*this.connectionIteration);
        const iterative = !this.primary ? 0 : ((50/(this.iterativeTotal))*this.iterativeIteration);
        const final = !this.hasFinalActions ? 0 : ((15/(this.rule.finalActions.length))*this.finalIteration);
        return { init, connect, iterative, final }
    }
    constructor(rule: Rule, schema: Schema, context?:  string[], scheduled?: boolean) {
        this.id = uuidv4();
        this.rule = rule;
        this.schema = schema;
        this.context = context;
        this.execute = !!context;
        this.scheduled = scheduled;
        this.primary = this.rule.primary;
        this.sources = this.rule.sources||[];
        this.status = {
            eta: false, text: "Initialising...",
            progress: { total: 0, init: false, connect: false, iterative: false, final: false },
            iteration: { current: 0, total: false },
        };
        this.hasInitActions = rule.initActions.length > 0;
        this.hasFinalActions = rule.finalActions.length > 0;
    }
    async runPrimary(){
        if (!this.primary) return;
        let sI = 1;
        const connectStart = new Date().getTime();
        await connect(this.schema, this.primary, this.connections);
        this.Emit({
            text: `Connecting to ${this.primary}`,
            progress: { total: (this.hasInitActions ? 15 : 0) + ((20/(this.sources.length+1))*sI),
            connect: (20/(this.sources.length+1))*sI }
        });
        for (const source of this.sources) {  sI++;
            await connect(this.schema, source.foreignName, this.connections);
            this.Emit({
                text: `Connecting to ${source.foreignName}`,
                progress: { total: (this.hasInitActions ? 15 : 0) +((20/(this.sources.length+1))*sI),
                connect: (20/(this.sources.length+1))*sI }
            });
        }
        await wait(1000, connectStart);
        await wait(500);
        const primary = this.connections[this.primary];
        let p = 0;
        let iI = 0;
        let speed = 0;
        let eta = "Estimating...";
        let lastCalc = 0;
        const entries = this.connections[this.primary].data;
        const entryCount = entries.length;
        this.Emit({ iteration: { total: entryCount } });
        const iterationStart = new Date().getTime();
        const etas: number[] = [];
        const iterativeLength = (this.hasInitActions&&this.hasFinalActions) ? 50 : (this.hasInitActions||this.hasFinalActions ? 35 : 80);
        function calculateTimeRemaining(currentWork: number, totalWork: number, speed: number, eta?: number): [string, number] {
            const timeRemainingInSeconds: number = eta || ((totalWork - currentWork) * speed) / 1000;
            const hours: number = Math.floor(timeRemainingInSeconds / 3600);
            const minutes: number = Math.floor((timeRemainingInSeconds % 3600) / 60);
            const seconds: number = Math.round(timeRemainingInSeconds % 60);
            const formattedTime: string = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            return [formattedTime, timeRemainingInSeconds];
        }
        const calcTotal = () => {
            let size = 100;
            if (Object.keys(this.connections).length>0) size -= 20;
            if (this.hasInitActions) size -= 15;
            if (this.hasFinalActions) size -= 15;
            return size;
        }
        const emitPrimary = (start: number, id: string) => {
            if (lastCalc - (new Date().getTime()) <= 0){
                lastCalc = start+1000;
                const [ _, t ] = calculateTimeRemaining(iI, entryCount, speed===0?10:speed );
                if (etas.length >= 5) etas.shift();
                etas.push(t);
                const totalMilliseconds = etas.reduce((acc, t) => acc + t, 0);
                const averageMilliseconds = totalMilliseconds / etas.length;
                const [ remaining ] = calculateTimeRemaining(0, 0, 0, averageMilliseconds );
                eta = remaining;
            }
            const x = (iI/entryCount) * iterativeLength;
            const r = Math.round((x + Number.EPSILON) * 10) / 10;
            if (r!=p) { p = r; this.queue.run(()=>this.Emit({
                progress: { iterative: x, total: ((this.hasInitActions||this.hasFinalActions)?35:20) + x },
                iteration: { current: iI }, eta, text: id
            })); }
            speed = new Date().getTime() - start;
        }
        for (const record of entries) { iI++;
            const start = new Date().getTime();
            const id = record[this.rule.primaryKey||primary.headers[0]];
            const joined = this.Join(record);
            if (!joined) continue;
            const template = { ...this.initTemplate, ...joined };
            const {todo: iterativeActions, error: iterativeError, warn: iterativeWarn } = await this.processActions(this.rule.iterativeActions, template, "iterative");
            const display = this.rule.display ? compile(template, this.rule.display) : id;
            const output: primaryResult = { id, actions: [], error: false, columns: [ { name: 'Display', value: display } ] };
            output.actions = iterativeActions;
            output.error = !!iterativeError;
            output.warn = !!iterativeWarn;
            for (const column of this.rule.columns){
                if (!column.name || !column.value) continue;
                output.columns.push({ name: column.name, value: compile(template, column.value) });
            }
            this.primaryResults.push(output);
            emitPrimary(start, id);
        }
        await wait(2000, iterationStart);
        this.queue.clear();
        this.Emit({ eta: "Finalising...", progress: {
                iterative: ((this.hasInitActions||this.hasFinalActions)?35:20) + iterativeLength,
                total: ((this.hasInitActions||this.hasFinalActions)?35:20) + iterativeLength 
            }
        });
    }
    async Run(){
        this.Emit();
        await wait(500);
        if (this.hasInitActions) this.Emit({ text: "Processing Init Actions..." });
        const initStart = new Date().getTime();
        const { todo: initActions, template: initTemplate, error: initError } = await this.processActions(this.rule.initActions, {}, "init");
        this.initTemplate = initTemplate;
        if (initError) throw initError;
        await wait(1000, initStart);
        await wait(500);
        if (this.primary) await this.runPrimary();
        if (this.hasFinalActions) this.Emit({ text: "Processing Final Actions..." });
        const finalStart = new Date().getTime();
        const {todo: finalActions, error: finalError } = await this.processActions(this.rule.finalActions, {}, "final");
        this.Emit({ text: "Finalising..." });
        await wait(1000, finalStart);
        this.Emit({ progress: { total: 100 }, eta: "Complete"});
        const columns = ["Display", ...this.rule.columns.filter(c=>c.name).map(c=>c.name)];
        return { primaryResults: this.primaryResults, initActions, finalActions, columns };
    }
    Evaluate(){}
    Execute(){}
    async processActions(actions: Action[], template: template, type: string) {
        const todo: actionResult[] = [];
        let error: undefined|xError;
        let warn: undefined|string;
        let i = 0;
        const iterativeLength = (this.hasInitActions&&this.hasFinalActions) ? 50 : (this.hasInitActions||this.hasFinalActions ? 35 : 80);
        const emit = () =>{
            if (type==="iterative") return;
            const pad2 =  {"init": 0, "final": (this.hasInitActions?35:20) + iterativeLength }[type] as number;
            const x = (15/(actions.length))*i;
            this.Emit({ progress: { total: pad2 + x, [type]: x } });
        }
        for (const action of (actions||[])) { i++;
            if (!action.enabled){ emit(); continue; }
            if (!(action.name in availableActions)) throw new xError(`Unknown action '${action.name}'.`);
            const result = await availableActions[action.name]({ action, template, connections: this.connections, execute: this.execute, data: {} })
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
        } return {todo, template, error, warn};
    }
    Join(record: Record<string, string>): template|false {
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
                if (source.inCase) return foreign[foreignKey].toLowerCase() === primary[primaryKey].toLowerCase();
                return foreign[foreignKey] === primary[primaryKey];
            } )
            if (source.require&&!foreignRecord) return false;
            joined[source.foreignName] = foreignRecord || {};
        } return joined;
    }
    Emit(update?: DeepPartial<jobStatus>) {
        this.status = { ...this.status,
            eta: update?.eta||this.status.eta, text: update?.text||this.status.text,
            progress: {...this.status.progress,  ...update?.progress},
            iteration: {...this.status.iteration, ...update?.iteration}
        };
        server.io.emit("job_status", this.status);
    }
}

export default async function evaluate(rule: Rule, schema: Schema, context?:  string[], scheduled?: boolean ): Promise<response> {
    try {
        const engine = new Engine(rule, schema, context, scheduled);
        return await engine.Run();
    } catch (e) {
        const error = e as { schema: string, rule: string, scheduled?: boolean };
        error.schema = schema.name||'unknown';
        error.rule = rule.name||'unknown';
        error.scheduled = scheduled;
        throw error;
    }
}

