import { compile } from "../modules/handlebars";
import { connect, connections } from "./providers";

function Join( primary: string, record: Record<string, any>,  connections: connections, sources: Source[] ) {
    const joined: Record<string, any> = { [primary]: record };
    for (const source of sources) {
        const foreignHeaders = connections[source.foreignName].headers;
        const primaryHeaders = connections[source.primaryName].headers;
        const foreignKey = source.foreignKey || foreignHeaders[0];
        const primaryKey = source.primaryKey || primaryHeaders[0];
        if (source.primaryName !== primary) continue;
        const foreignData = connections[source.foreignName].data;
        const foreignRecord = foreignData.find( item => item[foreignKey] === record[primaryKey] );
        joined[source.foreignName] = foreignRecord || {};
        if (!foreignRecord) continue;
        for (const nestedSource of sources) {
            const foreignHeaders = connections[source.foreignName].headers;
            const primaryHeaders = connections[source.primaryName].headers;
            const foreignKey = source.foreignKey || foreignHeaders[0];
            const primaryKey = source.primaryKey || primaryHeaders[0];
            if (nestedSource.primaryName !== source.foreignName) continue;
            const nestedForeignData = connections[nestedSource.foreignName].data;
            const nestedForeignRecord = nestedForeignData.find( item => item[foreignKey] === foreignRecord[primaryKey] );
            joined[nestedSource.foreignName] = nestedForeignRecord || {};
        }
    } return joined;
}

export async function engine(rule: Rule, schema: Schema, context?:  string[], scheduled?: boolean ) {
    const connections: connections = {};
    if (rule.primary) {
        if (rule.primary) await connect(schema, rule.primary, connections);
        for (const source of rule.sources||[]) await connect(schema, source.foreignName, connections);
        const primary = connections[rule.primary];

        console.time("Iteration");
        for (const record of connections[rule.primary].data) {
            const template = Join(rule.primary, record, connections, rule.sources||[]);
            const display = rule.display ? compile(template, rule.display) : record[rule.primaryKey||primary.headers[0]];
            console.log(display)
        }
        console.timeEnd("Iteration");
    }
    return true;
}

