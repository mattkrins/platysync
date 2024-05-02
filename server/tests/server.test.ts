import { suite, expect, test, expectTypeOf } from 'vitest';
import { server, path, testing } from '../src/server.ts';
import { FastifyInstance } from 'fastify';
import fs from 'fs-extra';

suite('Server Suite', () => {

  test('Self-Test', async () => {
    expect(testing).toBe(true);
    expect(path).toBe('./build/test');
    expect(fs.existsSync(path)).toBe(true);
  });

  test('Fastify', async () => {
    expectTypeOf({ server }).toEqualTypeOf<{ server: FastifyInstance }>();
  });

  test('Setup', async () => {
    const isSetup: boolean = (await server.inject({ method: "get", url: "/api/v1/auth/setup" })).json();
    expect(isSetup).toBeTypeOf('boolean');
    if (isSetup) return console.log("Setup is already complete.");
    const setup = (await server.inject({ method: "post", url: "/api/v1/auth/setup", body: {
      username: 'admin',
      password: 'admin',
    }})).json();
    expect(setup).toBeTruthy();

  });

});