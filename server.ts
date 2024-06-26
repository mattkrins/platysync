import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import fastifyStatic from '@fastify/static';
import pa, { dirname } from 'path';
import { fileURLToPath } from 'url';
import type { FastifyCookieOptions } from '@fastify/cookie'
import cookie from '@fastify/cookie'
import { getKey } from './server/modules/cryptography';
import { readFileSync } from 'node:fs';
import database, { Settings } from './server/components/database';
import winston from 'winston';
import auth from './server/routes/auth';
import schema from './server/routes/schema';
import settings from './server/routes/settings';
import user from './server/routes/user';
import { xError } from './server/modules/common';
import logs from './server/routes/logs';
import file from './server/routes/file';
import connectors from './server/routes/connectors';
const { combine, timestamp, json, simple, errors } = winston.format;

export let version = process.env.npm_package_version as string;
export const testing: boolean = process.env.NODE_ENV === 'test';
export const dev: boolean = process.env.NODE_ENV !== 'production';

if (!version){
  try {
    const json = readFileSync('package.json', 'utf-8')||"";
    const pack = JSON.parse(json)||{};
    version = pack.version;
    if (!version) throw Error("Unable to determin package ver.");
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

const dataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
const path = process.env.PSYC_PATH ? process.env.PSYC_PATH : `${dataPath}/platysync`;
export const paths = {
  base: path,
  schemas: `${path}/schemas`,
  cache: `${path}/cache`,
  storage: `${path}/storage`,
  logs: `${path}/logs`,
  database: `${path}/db.json`,
};

export interface FastifyRequestX extends FastifyRequest {
  session?: Session
}

function addRoute(api: FastifyInstance, prefix: string|undefined, routesToAdd: (route: FastifyInstance)=>Promise<void>|void, auth: boolean = true) {
  api.register( async (route: FastifyInstance)=>{
    if (auth) { route.addHook('preHandler', async (request: FastifyRequestX, reply) => {
      if (!request.cookies || !request.cookies['auth']) throw new xError("Missing session ID.", null, 401);
      const sessionId = request.cookies['auth'];
      const db = await database();
      const { data: { sessions } } = db;
      if (!sessions[sessionId]) throw new xError("No such session.", null, 401);
      request.session = sessions[sessionId];
    } ); }
    await routesToAdd(route);
  }, { prefix } );
}

async function routes(route: FastifyInstance) {
  if (dev) route.addHook('preHandler', (req, res, done: () => void) => setTimeout(done, 200) );
  addRoute(route, '/auth', auth, false);
  addRoute(route, '/schema/:schema_name/file', file);
  addRoute(route, '/schema/:schema_name/connector', connectors);
  addRoute(route, '/schema', schema);
  addRoute(route, '/settings', settings);
  addRoute(route, '/user', user);
  addRoute(route, '/log', logs);
  route.get('/', async (_, reply) => {
    const {data: { users, schemas }} = await database();
    const setup = users.length > 0;
    const response = {
      application: "PlatySync",
      version,
      setup,
    };
    if (setup){ reply.setCookie("setup", "true", { path: "/" }); } else {  reply.clearCookie("setup", { path: "/" }); }
    return response;
  });
}

const transports = new winston.transports.Console({ silent: true });
export const log: winston.Logger = winston.createLogger({
  level: 'info',
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports
});

export const history: winston.Logger = winston.createLogger({
  level: 'info',
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports
});

const initServer = async () => {
  if (!testing) {
    log.remove(transports)
    .add(new winston.transports.Console({ level: 'error', format: combine(errors({ stack: true }), timestamp(), winston.format.colorize(), simple()) }))
    .add(new winston.transports.File({ filename: `${paths.logs}/general.txt` }));
    history.remove(transports)
    .add(new winston.transports.File({ filename: `${paths.logs}/history.txt` }));
  }
  const server = fastify({ logger: false });
  const key = await getKey();
  server.register(cookie, { secret: key, } as FastifyCookieOptions);
  addRoute(server, '/api/v1', routes, false);
  const __dirname = dirname(fileURLToPath(import.meta.url));
  await server.register(fastifyStatic, { root: pa.join(__dirname, 'client'), });
  return server;
};


if (process.argv[1].endsWith('server.ts')||process.argv[1].endsWith('server.js')) {
  (async () => {
    try {
      const server = await initServer();
      const settings = await Settings();
      const port = process.env.PSYC_PORT ? parseInt(process.env.PSYC_PORT) : (settings.server?.port || 7528);
      const host = process.env.PSYC_HOST ? process.env.PSYC_HOST : (settings.server?.host || '0.0.0.0');
      server.listen({ port, host }, (err) => {
        if (err) throw err;
        if (!dev) console.log(`> PlatySync started @ http://localhost:7528`);
      });
      //log.info(`Server started on port ${port} ${https?'(https)':''} running ver. ${version}.`);
    } catch (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
  })();
}

export default initServer;
