import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import fastifyStatic from '@fastify/static';
import pa, { dirname } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import type { FastifyCookieOptions } from '@fastify/cookie'
import cookie from '@fastify/cookie'
import { readFileSync } from 'node:fs';
import winston from 'winston';
import socketioServer from "fastify-socket.io";
import { Server } from "socket.io";
import { getKey } from './server/modules/cryptography.js';
import database, { getDictionary, getSecrets, Settings } from './server/components/database.js';
import auth from './server/routes/auth.js';
import schema from './server/routes/schema.js';
import settings from './server/routes/settings.js';
import user from './server/routes/user.js';
import { xError } from './server/modules/common.js';
import logs from './server/routes/logs.js';
import file from './server/routes/schema/file.js';
import connectors from './server/routes/connectors.js';
import rule from './server/routes/rule.js';
import blueprint from './server/routes/blueprint.js';
import schedule from './server/routes/schedule.js';
import sdictionary from './server/routes/schema/dictionary.js';
import ssecrets from './server/routes/schema/secrets.js';
import dictionary from './server/routes/general/dictionary.js';
import secrets from './server/routes/general/secrets.js';
const { combine, timestamp, json, simple, errors } = winston.format;

export let version = process.env.npm_package_version as string;
export const testing: boolean = process.env.NODE_ENV === 'test';
export const dev: boolean = process.env.NODE_ENV === 'dev';
export const windows = process.platform === "win32";

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

declare module "fastify" {
  interface FastifyInstance { io: Server; }
}

function addRoute(api: FastifyInstance, prefix: string|undefined, routesToAdd: (route: FastifyInstance)=>Promise<void>|void, auth: boolean = true) {
  api.register( async (route: FastifyInstance)=>{
    if (auth) { route.addHook('preHandler', async (request: FastifyRequestX) => {
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
  addRoute(route, '/schema/:schema_name/schedule', schedule);
  addRoute(route, '/schema/:schema_name/blueprint', blueprint);
  addRoute(route, '/schema/:schema_name/rule', rule);
  addRoute(route, '/schema/:schema_name/dictionary', sdictionary);
  addRoute(route, '/schema/:schema_name/secret', ssecrets);
  addRoute(route, '/schema/:schema_name/connector', connectors);
  addRoute(route, '/schema/:schema_name/file', file);
  addRoute(route, '/schema', schema);
  addRoute(route, '/settings', settings);
  addRoute(route, '/dictionary', dictionary);
  addRoute(route, '/secret', secrets);
  addRoute(route, '/user', user);
  addRoute(route, '/log', logs);
  route.get('/', async (request) => {
    const extra: { auth?: Partial<Session>, dictionary?: kvPair[], secrets?: encryptedkvPair[] } = {};
    const { data: { users, sessions } } = await database();
    const setup = users.length > 0;
    if ( setup && request.cookies && request.cookies['auth'] && request.cookies['auth'] in sessions) {
      const session = sessions[request.cookies['auth']];
      const user = users.find(u=>u.username===session.username);
      if (user) {
        extra.auth = { username: user.username, expires: session.expires };
        extra.dictionary = await getDictionary();
        extra.secrets = await getSecrets();
      }
    }
    const response = {
      application: "PlatySync",
      version,
      setup,
      ...extra
    };
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

async function getHTTPS() {
  if (dev) return null;
  const settings = await Settings();
  if (settings.server?.https) {
    try { return {
      cert: fs.readFileSync(settings.server?.https.crt),
      key: fs.readFileSync(settings.server?.https.key),
    }; } catch { throw Error("Failed to init https from database."); }
  } else if (fs.existsSync(`${path}/https.crt`) && fs.existsSync(`${path}/https.key`)) {
    try { return {
        cert: fs.readFileSync(`${path}/https.crt`),
        key: fs.readFileSync(`${path}/https.key`),
    }; } catch { throw Error("Failed to init https from file."); }
  } return null;
}

export function initLogging() {
  if (testing) return;
  log.clear()
  .add(new winston.transports.Console({ level: 'error', format: combine(errors({ stack: true }), timestamp(), winston.format.colorize(), simple()) }))
  .add(new winston.transports.File({ filename: `${paths.logs}/general.txt` }));
  history.clear()
  .add(new winston.transports.File({ filename: `${paths.logs}/history.txt` }));
}

export default async function InitPlatySync() {
  initLogging();
  const https = await getHTTPS();
  const server = fastify({ logger: false, https });
  const key = await getKey();
  await server.register(cookie, { secret: key, } as FastifyCookieOptions);
  await server.register(socketioServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    }
  });
  addRoute(server, '/api/v1', routes, false);
  const __dirname = dirname(fileURLToPath(import.meta.url));
  await server.register(fastifyStatic, { root: pa.join(__dirname, 'client'), });
  log.info({version, message: "PlatySync Initialized."  });
  return server;
}