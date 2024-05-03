import { suite, expect, test, expectTypeOf } from 'vitest';
import { server, path, testing } from '../src/server.ts';
import { FastifyInstance } from 'fastify';
import fs from 'fs-extra';

let setupComplete: boolean|undefined;
export function setup(timeout = 4000): Promise<boolean> {
    return new Promise((resolve, reject)=> {
      let counter = 0;
      const intervalId = setInterval(() => {
          counter += 100;
          if (setupComplete) { clearInterval(intervalId); resolve(setupComplete); }
          if (counter >= timeout) {
              clearInterval(intervalId);
              return reject("Setup was not complete.");
          }
      }, 100);
    } );
}

suite('Server Suite', () => {

  test('Self-Test', async () => {
    expect(testing).toBe(true);
    expect(path).toBe('./build/test');
    expect(fs.existsSync(path)).toBe(true);
  });

  test('Fastify', async () => {
    expectTypeOf({ server }).toEqualTypeOf<{ server: FastifyInstance }>();
    const api = (await server.inject({ method: "get", url: "/api/" })).json();
    expect(api).toBeTruthy();
    expect(api.statusCode).toBe(404);
  });

  test('Setup', async () => {
    const isSetup1 = (await server.inject({ method: "get", url: "/api/v1/auth/setup" })).json();
    expect(isSetup1).toBeTypeOf('boolean');
    if (isSetup1){ // Test enviornment is already set up.
      setupComplete = true;
    } else {
      const setup = (await server.inject({ method: "post", url: "/api/v1/auth/setup", body: { username: 'admin', password: 'admin', }})).json();
      expect(setup).toBeTruthy();
      expect(setup.username).toBe('admin');
      expect(setup.id).toBeDefined();
      const isSetup: boolean = (await server.inject({ method: "get", url: "/api/v1/auth/setup" })).json();
      expect(isSetup).toBe(true);
      setupComplete = isSetup;
    }

  });

});