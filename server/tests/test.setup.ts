import { server, path as pa, testing } from '../src/server.ts';
import path from 'path';
import fs from 'fs-extra';
import { db } from '../src/db/database.ts';

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
    if (fs.existsSync(pa)) try { rimraf(pa); } catch { /* empty */ }
    await wait();
    if (fs.existsSync(pa)) try { fs.rmSync(pa, { recursive: true, force: true }); } catch { /* empty */ }
    await wait();
    if (fs.existsSync(pa)) rimraf(pa);
}