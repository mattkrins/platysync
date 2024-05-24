import { connection, connections } from "../typings/common.js";
import { server } from '../server.js';
import { xError } from '../modules/common.js';
import { Schema, Connectors } from './models.js';
import { base_provider } from './providers/base.js';
import FOLDER, { folder_options } from './providers/folder.js';
import CSV, { csv_options } from './providers/csv.js';
import STMC, { stmc_options } from './providers/stmc.js';
import LDAP, { ldap_options } from "./providers/ldap.js";
import EMAIL from './providers/email.js';
import PROXY from './providers/proxy.js';
import API from "./providers/api.js";

interface connectorConfig {[k: string]: unknown}
export default async function connect(schema: Schema, connectorName: string, connections: connections, id: string, config: connectorConfig = {}, caseSen = false): Promise<connection> {
    if (connections[connectorName]) return connections[connectorName];
    const connectors = new Connectors(schema.name);
    const provider = connectors.get(connectorName);
    server.io.emit("job_status", `Connecting to ${connectorName}`);
    let connection: connection = {rows:[], keyed: {}, objects: {}, provider};
    switch (provider.id) {
        case 'stmc': {
            const stmc = new STMC({...provider, schema, ...config} as stmc_options);
            const client = await stmc.configure();
            const users = await client.getUsers();
            const keyed: {[k: string]: object} = {};
            const rows = [];
            for (const row of users){
                if (keyed[row[id]]) continue;
                keyed[caseSen?row[id]:row[id].toLowerCase()] = row;
                rows.push(row);
            }
            connection = { ...connection, rows: users, provider, client, keyed }; break;
        }
        case 'csv': {
            const csv = new CSV({...provider, schema, ...config} as csv_options );
            const data = await csv.open() as { data: {[k: string]: string}[] };
            const keyed: {[k: string]: object} = {};
            const rows = [];
            for (const row of data.data){
                if (keyed[row[id]]) continue;
                keyed[caseSen?row[id]:row[id].toLowerCase()] = row;
                rows.push(row);
            } data.data = [];
            connection = { ...connection, rows, provider, keyed }; break;
        }
        case 'ldap': {
            const ldap = new LDAP({...provider, ...config} as ldap_options);
            const client = await ldap.configure();
            const { users, keyed, keyedUsers } = await client.search(ldap.attributes, id, caseSen);
            const close = async () => client.close();
            connection = { ...connection, rows: users, objects: keyedUsers, keyed, provider, client, close }; break;
        }
        case 'folder': {
            const folder = new FOLDER({...provider, ...config} as folder_options);
            await folder.configure();
            const keyed: {[k: string]: object} = {};
            const rows = folder.contents;
            for (const row of rows){
                if (keyed[row[id]]) continue;
                keyed[caseSen?row[id]:row[id].toLowerCase()] = row;
            }
            connection = { ...connection, rows, keyed, provider }; break;
        }
        default: throw new xError("Unknown connector.");
    } connections[connectorName] = connection; return connection;
}

export const providers: { [id: string]: typeof base_provider } = {
    folder: FOLDER,
    email: EMAIL,
    proxy: PROXY,
    csv: CSV,
    stmc: STMC,
    ldap: LDAP,
    api: API,
};
