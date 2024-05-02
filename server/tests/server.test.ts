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
    const res = await server.inject({ method: "get", url: "/api/v1/auth/setup" });
    const data = res.json();
    expect(data).toBe(false);
  });

});