import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';
import { log, paths, version } from '../..';
import { xError } from '../modules/common';

interface Database {
    version: string;
    settings: Settings;
    users: User[];
    schemas: Schema[];
    sessions: { [k: string]: Session };
}

export const defaultData: Database = {
    version: '',
    settings: {
        logLevel: 'info',
        redact: ['password', 'secret', 'key','token','code', 'unicodePwd'],
    },
    users: [],
    schemas: [],
    sessions: {},
};

let db: Low<Database>;

export default async function database(force?: boolean) {
    if (!db || force){
        db = await JSONFilePreset(paths.database, defaultData);
        await upgrade();
        const { settings, ...rest } = db.data;
        db.data = { ...defaultData, ...rest, settings: { ...defaultData.settings, ...settings }  };
        log.debug("Database Initialized");
    }
    return db;
}

export async function sync() { return await (await database()).write(); }

async function upgrade() {
    if (db.data.version===version) return;
    try {
        log.info(`Upgrading database from ${db.data.version} to ${version}`);
        db.data.version = version as string;
        await db.write();
    } catch (e) {
        log.error(`Failed to upgrade database from ${db.data.version} to ${version}`);
        throw new xError(e);
    }
}

export async function Settings() { return (await database()).data.settings; }
export async function Users() { return (await database()).data.users; }
export async function getSchemas() { return (await database()).data.schemas; }
export async function getSchema(schema_name: string, fieldName?: string) {
    const { data: { schemas } } = await database();
    const schema = schemas.find(s=>s.name===schema_name);
    if (!schema) throw new xError("Unknown schema.", fieldName, 404);
    return schema;
}
export async function getFiles(schema_name: string, fieldName?: string) { return (await getSchema(schema_name, fieldName)).files; }
export async function getActions(schema_name: string, fieldName?: string) { return (await getSchema(schema_name, fieldName)).actions; }
export async function getConnectors(schema_name: string, fieldName?: string) { return (await getSchema(schema_name, fieldName)).connectors; }
export async function getRules(schema_name: string, fieldName?: string) { return (await getSchema(schema_name, fieldName)).rules; }
export async function getSchedules(schema_name: string, fieldName?: string) { return (await getSchema(schema_name, fieldName)).schedules; }