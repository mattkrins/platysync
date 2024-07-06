import { FastifyInstance } from "fastify";
import { contains, isNotEmpty, validate, xError } from "../modules/common";
import database, { Settings, defaultData } from "../components/database";
import { decrypt, encrypt } from "../modules/cryptography";
import axios from "axios";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";

const levels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];

function sanitizeSettings(settings: Settings) {
    const { key, redact, enableRun, ...cleaned} = settings;
    return cleaned;
}

export default async function (route: FastifyInstance) {
    route.get('/', async (request, reply) => {
        try {
            const { key, redact, enableRun, ...settings} = await Settings();
            return settings;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/', async (request, reply) => {
        const { key, redact, ...settings} = request.body as Settings;
        try {
            validate( { logLevel: settings.logLevel }, {
                logLevel: contains(levels, 'Invalid log level.'),
            });
            const db = await database();
            for (const key of (Object.keys(settings))){
                if (key.includes("proxy") && settings[key]===""){ delete db.data.settings[key]; continue; }
                if (settings.proxy_password && typeof settings.proxy_password === 'string' ) {
                    if (settings.proxy_password===""){ delete db.data.settings.proxy_password; continue; }
                    db.data.settings.proxy_password = await encrypt(settings.proxy_password as string); continue;
                }
                db.data.settings[key] = settings[key];
            }
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
    route.post('/test_proxy', async (request, reply) => {
        let { proxy_url, proxy_username, proxy_password } = (request.body || {}) as Partial<Settings>;
        try {
            validate( { proxy_url }, {
                proxy_url: isNotEmpty('Proxy URL can not be empty.'),
            });
            const url = new URL(proxy_url as string);
            if (proxy_username) url.username = proxy_username;
            if (proxy_password){
                if (typeof proxy_password !== 'string') proxy_password = await decrypt(proxy_password as Hash);
                url.password = proxy_password as string;
            }
            const response = await axios.get('https://www.example.com/', {
                httpAgent: new HttpProxyAgent(url),
                httpsAgent: new HttpsProxyAgent(url),
                proxy: false as const,
            });
            if (!response || !response.data) throw new xError('No data returned.', 'proxy_url');
            if (!response.data.includes("Example Domain")) throw new xError('Unexpected malformed data.', 'proxy_url');
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
}