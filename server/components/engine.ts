import { providers } from "./providers";

interface connections { [name: string]: {} }

export async function engine(rule: Rule, schema: Schema, context?:  string[], scheduled?: boolean ) {
    const connections: connections = {};
    const use = [
        { name: 'MyCSV', primary_key: 'STKEY' },
        { name: 'MyCSV', primary_key: 'STKEY', foreign_key: 'STKEY' },
    ];
    for (const u of use){
        const { id, name, ...options} = schema.connectors.find(c=>c.name===u.name) as Connector;
        const provider = new providers[id]({ id, name, ...options, schema });
        await provider.preConfigure();
        await provider.connect();
    }
}
