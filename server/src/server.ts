import Fastify, { FastifyInstance } from 'fastify'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import cors from '@fastify/cors'
import routes from './routes.js'
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
export const path = `${dataPath}/cdapp`;
export const paths = {
  path,
  schemas: `${path}/schemas`,
  cache: `${path}/cache`
};
for (const path of Object.values(paths)) if (!fs.existsSync(path)) fs.mkdirSync(path);
const pkg = fs.readFileSync('package.json', 'utf-8');
const pack = JSON.parse(pkg) as { version: string };
export const version = parseFloat(pack.version);

export const log = winston.createLogger({ //TODO - connect this to settings gui
  level: 'debug', // silly > debug > verbose > http > info > warn > error
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.Console({ level: 'error', format: combine(errors({ stack: true }), timestamp(), winston.format.colorize(), simple()) }),
    new winston.transports.File({ filename: `${path}/log.txt` }),
  ]
}); // log.level = 'info';


export const server: FastifyInstance = Fastify({}).withTypeProvider<JsonSchemaToTsProvider>();
await database(path);
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

const start = async () => {
  try {
    await server.listen({ port: 2327, host: '0.0.0.0' }); //TODO - link to GUI settings
    const address = server.server.address();
    const port = typeof address === 'string' ? address : address?.port;
    log.info(`Server started on port ${port}.`);
    console.log(`  ➜  Server:   http://localhost:${port}/`);
  } catch (err) {
    server.log.error(err);
    log.error(err);
    process.exit(1);
  }
}
start()
/**
    Force value to Error Type
    @param value - Any stringifyable value
    @returns Value as Error type
*/
export function _Error(value: unknown): Error {
  if (value instanceof Error) return value;
  let stringified = '[Unable to stringify the thrown value]';
  try {
    stringified = JSON.stringify(value);
  } catch { /* empty */ }
  return new Error(stringified);
}
