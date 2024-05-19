import { describe, expect, test, expectTypeOf, beforeAll, afterAll } from 'vitest';
import { server, path, testing, init } from '../src/server.ts';
import { FastifyInstance } from 'fastify';
import fs from 'fs-extra';
import { clear } from './test.setup.ts';

describe.sequential('Server Suite', () => {
  beforeAll(async () => {
      await init();
  });

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
    const setup = (await server.inject({ method: "post", url: "/api/v1/auth/setup", body: { username: 'admin', password: 'admin', }})).json();
    expect(setup).toBeTruthy();
    expect(setup.username).toBe('admin');
    expect(setup.id).toBeDefined();
    const isSetup: boolean = (await server.inject({ method: "get", url: "/api/v1/auth/setup" })).json();
    expect(isSetup).toBe(true);
  });

  afterAll(async () => {
      await clear();
  });

});