import esMain from 'es-main';
import Fastify, { FastifyInstance } from 'fastify';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import cors from '@fastify/cors';
import routes from './routes.js';
import * as fs from 'node:fs';
import { database } from './db/database.js';
import { Server } from "socket.io";
import socketioServer from "fastify-socket.io";
import fastifyStatic from "@fastify/static";
import pa, { dirname } from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
const { combine, timestamp, json, simple, errors } = winston.format;

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");

export const testing = !esMain(import.meta);
export let path = !testing ? `${dataPath}/platysync` : './build/test';
export const paths = {
  path,
  schemas: `${path}/schemas`,
  cache: `${path}/cache`,
  storage: `${path}/storage`,
  logs: `${path}/logs`,
  journal: `${path}/logs/journal`,
};
export let version = process.env.npm_package_version as string;

export let log: winston.Logger;
export let history: winston.Logger;

const options = {
  maxParamLength: 1000,
  https: (fs.existsSync(`${path}/https.crt`) && fs.existsSync(`${path}/https.key`)) ? {
    cert: fs.readFileSync(`${path}/https.crt`),
    key: fs.readFileSync(`${path}/https.key`),
  } : undefined,
};

export const server: FastifyInstance = Fastify(options).withTypeProvider<JsonSchemaToTsProvider>();

await server.register(cors, {
  origin: "*"
});

declare module "fastify" {
  interface FastifyInstance {
    io: Server;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
server.register(socketioServer as any, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

server.register(fastifyStatic, { root: pa.join(__dirname, 'client'), });

server.register( routes, { prefix: '/api/v1' } );

export const init = async (altPath?: string) => {
  if (altPath) path = altPath;
  for (const path of Object.values(paths)) if (!fs.existsSync(path)) fs.mkdirSync(path);
  await database(path);
  log = winston.createLogger({
    level: 'info',
    format: combine(errors({ stack: true }), timestamp(), json()),
    transports: testing ? [ new winston.transports.Console({ silent: true }) ] : [
      new winston.transports.Console({ level: 'error', format: combine(errors({ stack: true }), timestamp(), winston.format.colorize(), simple()) }),
      new winston.transports.File({ filename: `${paths.logs}/general.txt` }),
    ],
  });
  history = winston.createLogger({
    level: 'info',
    format: combine(errors({ stack: true }), timestamp(), json()),
    transports: testing ? [ new winston.transports.Console({ silent: true }) ] : [ new winston.transports.File({ filename: `${paths.logs}/history.txt` }) ],
  });
  if (!version){
    const json = fs.readFileSync('package.json', 'utf-8')||"";
    const pack = JSON.parse(json)||{};
    version = pack.version;
    if (!version) throw Error("Unable to determin ver.");
  }
}

export const startServer = async (port = 2327) => {
  try {
    await init();
    if (testing) return server;
    await server.listen({ port, host: '0.0.0.0' }); //TODO - link to GUI settings
    log.info(`Server started on port ${port} running ver. ${version}.`);
    console.log(`  ➜  Server:   http://localhost:${port}/`);
    console.log(`  ➜  log:   ${paths.logs}/general.txt`);
    return server;
  } catch (err) {
    server.log.error(err);
    log.error(err);
    throw err;
  }
}

if (!testing) startServer();