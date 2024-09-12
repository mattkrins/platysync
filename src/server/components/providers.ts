import { Engine } from "./engine";
import CSV from "./providers/CSV";
import FOLDER from "./providers/FOLDER";
import LDAP from "./providers/LDAP";
import STMC from "./providers/STMC";
import { base_provider } from "./providers/base";

export interface connections { [name: string]: base_provider }
export interface contexts {[name: string]: base_provider}

export async function connect(schema: Schema, name: string, connectors: connections, engine: Engine, key?: string, overrides?: { [k: string]: unknown }) {
    if (connectors[name]) return connectors[name];
    engine.Emit({ text: `Connecting to ${name}` });
    const { id, ...options} = schema.connectors.find(c=>c.name===name) as Connector;
    if (!key) key = options.headers[0];
    const provider = new providers[id]({ id, ...options, ...overrides, schema, key });
    await provider.initialize();
    await provider.configure();
    await provider.connect(connectors, engine);
    connectors[name] = provider;
    return provider;
}

export async function addContext(schema: Schema, { name, ...context}: Context, contexts: contexts) {
    const { id, ...options} = schema.connectors.find(c=>c.name===name) as Connector;
    const provider = new providers[id]({ id, ...options, ...context, schema });
    await provider.initialize();
    await provider.configure();
    contexts[name] = provider;
    return provider;
}

export const providers: { [id: string]: typeof base_provider } = {
    csv: CSV,
    ldap: LDAP,
    folder: FOLDER,
    stmc: STMC,
};
