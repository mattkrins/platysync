import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';
import { log, paths, version } from '../../server';
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
    }
    return db;
}

async function upgrade() {
    try {
        log.info(`Upgrading version from ${db.data.version} to ${version}`);
        db.data.version = version as string;
        await db.write();
    } catch (e) {
        log.error(`Failed to upgrade database from ${db.data.version} to ${version}`);
        throw new xError(e);
    }
}

export async function Settings() { return (await database()).data.settings; }
export async function Users() { return (await database()).data.users; }
export async function Schemas() { return (await database()).data.schemas; }
export async function getFiles(schema_name: string, fieldName?: string) {
    const { data: { schemas } } = await database();
    const schema = schemas.find(s=>s.name===schema_name);
    if (!schema) throw new xError("Unknown schema.", fieldName, 404);
    return schema.files;
}
