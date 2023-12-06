import Fastify from 'fastify';
import cors from '@fastify/cors';
import routes from './routes.js';
import * as fs from 'node:fs';
import { database } from './db/database.js';
import socketioServer from "fastify-socket.io";
import fastifyStatic from "@fastify/static";
import pa, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
export const path = `${dataPath}/cdapp`;
export const paths = {
    path,
    schemas: `${path}/schemas`,
    cache: `${path}/cache`,
};
for (const path of Object.values(paths))
    if (!fs.existsSync(path))
        fs.mkdirSync(path);
export const server = Fastify({}).withTypeProvider();
await database(path);
await server.register(cors, {
    origin: "*"
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
server.register(socketioServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
server.register(fastifyStatic, { root: pa.join(__dirname, 'client'), });
server.register(routes, { prefix: '/api/v1' });
const start = async () => {
    try {
        await server.listen({ port: 2327, host: '0.0.0.0' });
        const address = server.server.address();
        const port = typeof address === 'string' ? address : address?.port;
        console.log(`  ➜  Server:   http://localhost:${port}/`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
/**
    Force value to Error Type
    @param value - Any stringifyable value
    @returns Value as Error type
*/
export function _Error(value) {
    if (value instanceof Error)
        return value;
    let stringified = '[Unable to stringify the thrown value]';
    try {
        stringified = JSON.stringify(value);
    }
    catch { /* empty */ }
    return new Error(stringified);
}
