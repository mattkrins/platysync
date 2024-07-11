import { compile } from "../modules/handlebars";
import { connect, connections } from "./providers";

function Join( primary: string, record: Record<string, string>,  connections: connections, sources: Source[] ) {
    const joined: Record<string, any> = { [primary]: record };
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

export default async function evaluate(rule: Rule, schema: Schema, context?:  string[], scheduled?: boolean ): Promise<response> {
    const connections: connections = {};
    if (rule.primary) {
        await connect(schema, rule.primary, connections);
        for (const source of rule.sources||[]) await connect(schema, source.foreignName, connections);
        const primary = connections[rule.primary];
        console.time("Iteration");
        for (const record of connections[rule.primary].data) {
            const primaryResults: primaryResult[] = [];
            const id = record[rule.primaryKey||primary.headers[0]];
            const template = Join(rule.primary, record, connections, rule.sources||[]);
            if (!template) continue;
            const display = rule.display ? compile(template, rule.display) : id;
            console.log(display);
        }
        console.timeEnd("Iteration");
    }
    return { primary: [], initActions: [], finalActions: [] };
}

