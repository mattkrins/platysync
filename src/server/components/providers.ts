import { xError } from "../modules/common.js";
import { Engine } from "./engine.js";
import API from "./providers/API.js";
import CSV from "./providers/CSV.js";
import FOLDER from "./providers/FOLDER.js";
import LDAP from "./providers/LDAP.js";
import STMC from "./providers/STMC.js";
import { base_provider } from "./providers/base.js";

export interface connections { [name: string]: base_provider }

export async function connect(schema: Schema, name: string, connectors: connections, engine: Engine, key?: string, overrides?: { [k: string]: unknown }) {
    if (connectors[name]) return connectors[name];
    engine.Emit({ text: `Connecting to ${name}` });
    const { id, ...options} = schema.connectors.find(c=>c.name===name) as Connector;
    if (!key) key = options.headers[0];
    const provider = new providers[id]({ id, ...options, ...overrides, schema, key });
    await provider.initialize();
    await provider.configure();
    try { await provider.connect(connectors, engine); }
    catch (e) { throw new xError(e); }
    connectors[name] = provider;
    return provider;
}

export const providers: { [id: string]: typeof base_provider } = {
    csv: CSV,
    ldap: LDAP,
    folder: FOLDER,
    stmc: STMC,
    api: API,
};
