import { xError } from "../modules/common";
import { compile } from "../modules/handlebars";
import { availableActions } from "./actions";
import { connect, connections } from "./providers";

function Join( primary: string, record: Record<string, string>,  connections: connections, sources: Source[] ): template|false {
    const joined: template = { [primary]: record };
    for (const source of sources) {
        if (!joined[source.primaryName] || !connections[source.foreignName]) continue;
        const primary = joined[source.primaryName];
        const foreignHeaders = connections[source.foreignName].headers;
        const primaryHeaders = connections[source.primaryName].headers;
        const foreignKey = source.foreignKey || foreignHeaders[0];
        const primaryKey = source.primaryKey || primaryHeaders[0];
        const foreignData = connections[source.foreignName].data;
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

async function processActions(actions: Action[], template: template, connections: connections, execute: boolean) {
    const todo: {name: string, display?: string, result: result }[] = [];
    let error: undefined|xError;
    for (const action of (actions||[])) {
        if (!action.enabled) continue;
        if (!(action.name in availableActions)) throw new xError(`Unknown action '${action.name}'.`);
        const result = await availableActions[action.name]({ action, template, connections, execute, data: {} })
        if (!result)  throw new xError(`Failed to run action '${action.name}'.`);
        const name = (action.display && action.display!==action.name) ? { display: action.display||action.name } : {}
        todo.push({name: action.name, result, ...name });
        if (result.error){
            if ((result.error as xError).message) result.error = (result.error as xError).message;
            error = new xError(result.error, action.name);
            break;
        }
    } return {todo, template, error};
}

export default async function evaluate(rule: Rule, schema: Schema, context?:  string[], scheduled?: boolean ): Promise<response> {
    try {
        const connections: connections = {};
        const execute = !!context;
        const {todo: initActions, template: initTemplate, error: initError } = await processActions(rule.initActions, {}, connections, execute);
        const primaryResults: primaryResult[] = [];
        if (rule.primary) {
            await connect(schema, rule.primary, connections);
            for (const source of rule.sources||[]) await connect(schema, source.foreignName, connections);
            const primary = connections[rule.primary];
            for (const record of connections[rule.primary].data) {
                const id = record[rule.primaryKey||primary.headers[0]];
                const joined = Join(rule.primary, record, connections, rule.sources||[]);
                if (!joined) continue;
                const template = { ...initTemplate, ...joined };
                const {todo: iterativeActions, error: initError } = await processActions(rule.iterativeActions, template, connections, execute);
                const display = rule.display ? compile(template, rule.display) : id;
                const output: primaryResult = { id, actions: [], actionable: false, columns: [ { name: 'Display', value: display } ] };
                output.actions = iterativeActions;
                output.actionable = iterativeActions.filter(t=>t.result.error).length <= 0;
                for (const column of rule.columns){
                    if (!column.name || !column.value) continue;
                    output.columns.push({ name: column.name, value: compile(template, column.value) });
                }
                primaryResults.push(output);
            }
        }
        const {todo: finalActions, error: finalError } = await processActions(rule.finalActions, {}, connections, execute);
        const columns = ["Display", ...rule.columns.filter(c=>c.name).map(c=>c.name)];
        return { primaryResults, initActions, finalActions, columns };
    } catch (e) {
        const error = e as { schema: string, rule: string, scheduled?: boolean };
        error.schema = schema.name||'unknown';
        error.rule = rule.name||'unknown';
        error.scheduled = scheduled;
        throw error;
    }
}

