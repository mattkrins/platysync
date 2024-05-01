import { suite, expect, test, expectTypeOf } from 'vitest';
import { start, server } from '../src/server.ts';
import { FastifyInstance } from 'fastify';

suite('Server Suite', () => {

  test('Server Init', async () => {
    const server1 = await start();
    expectTypeOf({ server1 }).toEqualTypeOf<{ server1: FastifyInstance }>();
    expect(server.server.listening).toBe(true);
  });

});