import { FastifyInstance } from "fastify";
import { contains, validate, xError } from "../modules/common";
import database, { Settings, defaultData } from "../components/database";

const levels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];

function sanitizeSettings(settings: Settings) {
    const { key, redact, enableRun, ...cleaned} = settings;
    return cleaned;
}

export default async function settings(route: FastifyInstance) {
    route.get('/', async (request, reply) => {
        try {
            const { key, redact, enableRun, ...settings} = await Settings();
            return settings;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/', async (request, reply) => {
        const settings = request.body as Settings;
        try {
            validate( { logLevel: settings.logLevel }, {
                logLevel: contains(levels, 'Invalid log level.'),
            });
            const db = await database();
            for (const key of (Object.keys(settings))) db.data.settings[key] = settings[key];
            await db.write();
            return settings;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/purge', async (request, reply) => {
        try {
            const db = await database(true);
            return {...sanitizeSettings(db.data.settings), enableRun: db.data.settings.enableRun||false };
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/reset', async (request, reply) => {
        try {
            const db = await database();
            db.data = defaultData;
            await db.write();
            await database(true);
            return sanitizeSettings(db.data.settings);
        } catch (e) { new xError(e).send(reply); }
    });
}