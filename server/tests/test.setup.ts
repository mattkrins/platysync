import { server, path, testing } from '../src/server.ts';
import fs from 'fs-extra';
import { db } from '../src/db/database.ts';
import { InjectOptions } from 'fastify';

const wait = (time = 1000) => new Promise((r)=> setTimeout(r, time) );

interface options extends InjectOptions {
    base_url?: string;
    auth?: string;
    data?: InjectOptions['body'];
    url: string;
    session?: string;
    expectStatus?: number;
}

export async function useAPI({ data, url, base_url, session, method = "get", expectStatus, ...options }: options, jsonify = true ) {
    const headers = session ? { headers: { Authorization : `Bearer ${session}` } } : {};
    const request = await server.inject({ method: method, url: `${base_url||"/api/v1"}${url}`, body: data, ...headers, ...options })
    if (request.statusCode !== 200 && request.statusCode !== expectStatus) throw Error(JSON.stringify(request.json()||request.body));
    return jsonify ? request.json() : request.body;
}
export const get = (o: options) => useAPI({...o, method: "get"});
export const post = (o: options) => useAPI({...o, method: "post"});
export const put = (o: options) => useAPI({...o, method: "put"});
export const del = (o: options) => useAPI({...o, method: "delete"});

export async function setup() {
    process.stdout.write('\x1Bc');
    if (path!=='./build/test' || !testing) throw Error("Not running in test environment.");
}

export async function remove(time = 1000, tries = 0) {
    tries ++;
    await wait();
    try { fs.rmSync(path, { recursive: true, force: true, maxRetries: 2 }); } catch (e) {
        if (tries > 3){ console.error(`Failed to remove test environment @ ${path}`); throw e; }
        await remove(time, tries);
    }
}

export async function clear() {
    await wait();
    await db.close();
    await wait();
    await remove();
}