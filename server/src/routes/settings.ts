import { FastifyInstance } from "fastify";
import { validStr, xError } from "../modules/common.js";
import * as fs from 'fs';
import { log, path, version } from "../server.js";
import YAML, { stringify } from 'yaml'
import { db } from "../db/database.js";

interface settings {
    version: string;
    logLevel: string;
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
            fs.writeFileSync(settingsPath, stringify(settings));
            return settings;
        }
        catch (e) { new xError(e).send(reply); }
    });
}