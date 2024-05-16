import { describe, expect, test } from 'vitest';
import { init } from '../src/server.ts';
import { beforeAll, afterAll } from 'vitest';
import { clear, get, post, del } from './test.setup.ts';

describe.sequential('Auth Suite', () => {

  let session: string;
  beforeAll(async () => {
      await init();
  });

  test('Setup', async () => {
    const isSetup1 = await get({url: "/auth/setup" });
    expect(isSetup1).toBe(false);
    const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin', } });
    session = id;
    const isSetup2 = await get({url: "/auth/setup" });
    expect(isSetup2).toBe(true);
  });

  test('Login', async () => {
    const login = await post({url: "/auth", session, data: { username: 'admin', password: 'admin', } });
    expect(login).toBeTruthy();
    expect(login.username).toBe('admin');
    expect(login.id).toBeDefined();
  });

  test('Logout', async () => {
    const logout = await del({url: "/auth", session, data: { username: 'admin', password: 'admin', } });
    expect(logout).toBeTruthy();
  });

  afterAll(async () => {
      await clear();
  });

});