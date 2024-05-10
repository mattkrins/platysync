import { describe, expect, test } from 'vitest';
import { init, version } from '../src/server.ts';
import { beforeAll, afterAll } from 'vitest';
import { clear, post, del, put } from './test.setup.ts';

describe.sequential('Schema Suite', () => {

  let session: string;
  beforeAll(async () => {
      await init("./build/test");
      const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin' } });
      session = id;
  });

  test('Create', async () => {
    const schema = await post({url: "/schema", session, data: { name: "Test" } });
    expect(schema).toBeTruthy();
    expect(schema.name).toBe('Test');
    expect(schema.version).toBe(version);
  });

  test('Rename', async () => {
    const schema = await put({url: "/schema/Test", session, data: { name: "Test1" } });
    expect(schema).toBeTruthy();
    expect(schema.name).toBe('Test1');
    expect(schema.version).toBe(version);
  });

  test('Delete', async () => {
    const deleted = await del({url: "/schema/Test1", session });
    expect(deleted).toBe(true);
  });

  afterAll(async () => {
      await clear();
  });

});