import CSV from "./providers/CSV";
import FOLDER from "./providers/FOLDER";
import LDAP from "./providers/LDAP";
import STMC from "./providers/STMC";
import { base_provider } from "./providers/base";

export interface connections { [name: string]: base_provider }

export async function connect(schema: Schema, name: string, connectors: connections, key?: string) {
    const { id, ...options} = schema.connectors.find(c=>c.name===name) as Connector;
    if (!key) key = options.headers[0];
    const provider = new providers[id]({ id, ...options, schema, key });
    await provider.initialize();
    await provider.configure();
    await provider.connect();
    connectors[name] = provider;
    return provider;
}

export const providers: { [id: string]: typeof base_provider } = {
    csv: CSV,
    ldap: LDAP,
    folder: FOLDER,
    stmc: STMC,
};
