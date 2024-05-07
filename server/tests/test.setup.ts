import { server, path as pa, testing } from '../src/server.ts';
import path from 'path';
import fs from 'fs-extra';
import { db } from '../src/db/database.ts';
import { InjectOptions } from 'fastify';

const wait = (time = 1000) => new Promise((r)=> setTimeout(r, time) );

function rimraf(dir_path: string) {
  if (fs.existsSync(dir_path)) {
      fs.readdirSync(dir_path).forEach(function(entry) {
          const entry_path = path.join(dir_path, entry);
          if (fs.lstatSync(entry_path).isDirectory()) {
              rimraf(entry_path);
          } else {
              fs.unlinkSync(entry_path);
          }
      });
      fs.rmSync(dir_path, { recursive: true, force: true });
  }
}

interface options extends InjectOptions {
    base_url?: string;
    auth?: string;
    data?: InjectOptions['body'];
    url: string;
    session?(timeout?: number): Promise<string>;
    expectStatus?: number;
}

export async function useAPI({ data, url, base_url, session, method = "get", expectStatus, ...options }: options, jsonify = true ) {
    const headers = session ? { headers: { Authorization : `Bearer ${await session()}` } } : {};
    const request = await server.inject({ method: method, url: `${base_url||"/api/v1"}${url}`, body: data, ...headers, ...options })
    if (request.statusCode !== 200 && request.statusCode !== expectStatus) throw Error(JSON.stringify(request.json()||request.body));
    return jsonify ? request.json() : request.body;
}
export const get = (o: options) => useAPI({...o, method: "get"});
export const post = (o: options) => useAPI({...o, method: "post"});
export const put = (o: options) => useAPI({...o, method: "put"});
export const del = (o: options) => useAPI({...o, method: "delete"});

export async function setup() {
    if (pa!=='./build/test' || !testing) throw Error("Not running in test environment.");
    console.log(`Built test enviornment @ ${pa}`)
}

export async function teardown() {
    console.log("Removing test enviornment...")
    await server.close();
    await db.close();
    //NOTE - rmSync {recursive: true} would always fail here.
    // running rimraf by itself is successful, but throws a false positive error.
    // waiting a short time and then running the command again will confirm the removal was successful
    await wait();
    if (fs.existsSync(pa)) try { rimraf(pa); } catch { /* empty */ }
    await wait();
    if (fs.existsSync(pa)) try { fs.rmSync(pa, { recursive: true, force: true }); } catch { /* empty */ }
    await wait();
    if (fs.existsSync(pa)) rimraf(pa);
}