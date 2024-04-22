import { FastifyInstance } from "fastify";
import { validStr, xError } from "../modules/common.js";
import * as fs from 'fs';
import { log, path, paths, version } from "../server.js";
import YAML, { stringify } from 'yaml'
import { db } from "../db/database.js";
import { schemas } from "./schema.js";

interface settings {
    version: string;
    logLevel: string;
    schemasPath?: string;
}
let settings: settings = {
    version: '',
    logLevel: 'info',
};

async function init(settingsPath: string) {
    if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, stringify(settings));
    const file = fs.readFileSync(settingsPath, 'utf8');
    const parsed = YAML.parse(file) as settings;
    settings = parsed;
    if (settings.version != version) {
        try {
            log.info(`Upgrading version from ${settings.version} to ${version}`);
            await db.sync({ alter: true });
            settings.version = version as string;
            fs.writeFileSync(settingsPath, stringify(settings));
        } catch (e) {
            log.error("Failed to upgrade version");
            throw new xError(e);
        }
    }
    if (!validStr(settings.version)) settings.version = version as string;
    if (settings.logLevel) log.level = settings.logLevel;
    if (settings.schemasPath && fs.existsSync(settings.schemasPath as string)) paths.schemas = settings.schemasPath as string;
}

export default async function (route: FastifyInstance) {
    const settingsPath = `${path}/settings.yaml`;
    await init(settingsPath);
    route.get('/', async (request, reply) => {
        try { return settings; }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/', async (request, reply) => {
        const {version, ...changes} = request.body as settings;
        try {
            settings = {...settings, ...changes };
            if (settings.logLevel !== changes.logLevel) log.warn(`Logging level changed from ${settings.logLevel} to ${changes.logLevel} `);
            if (settings.logLevel) log.level = settings.logLevel;
            if (!validStr(settings.schemasPath||"")){
                delete settings.schemasPath;
                paths.schemas = `${path}/schemas`;
            } else {
                if (!fs.existsSync(settings.schemasPath as string)) throw new xError("Path does not exist.", "schemasPath", 404);
                paths.schemas = settings.schemasPath as string;
            }
            await schemas.load();
            fs.writeFileSync(settingsPath, stringify(settings));
            return settings;
        }
        catch (e) { new xError(e).send(reply); }
    });
}