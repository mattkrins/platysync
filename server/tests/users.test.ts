import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { clear, del, get, post, put } from './test.setup.ts';
import { init } from '../src/server.ts';

describe.sequential('Schedule Users', () => {

    let session: string;
    beforeAll(async () => {
        await init();
        const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin' } });
        session = id;
    });
  
    test('Add', async () => {
        const data = { form: { username: "user", password: "password2", group: "admin", stats: true, enabled: false } };
        const user = await post({url: "/user", session, data });
        expect(user).toBeTruthy();
        expect(user.username).toBe("user");
        expect(user.enabled).toBe(false);
    });

    test('Get', async () => {
        const users = await get({url: "/user", session });
        expect(users).toBeTruthy();
        expect(users.length).toBe(2);
    });
  
    test('Edit', async () => {
        const data = {
            editing: { username: "user", password: "password2", group: "admin", stats: true, enabled: false },
            form: { username: "user", password: "password", group: "user", stats: true, enabled: false },
        };
        const user = await put({url: "/user", session, data });
        expect(user).toBeTruthy();
        expect(user.group).toBe("user");
    });
  
    test('Login: Disabled', async () => {
        await post({url: "/auth", data: { username: 'user', password: 'password' }, expectStatus: 403 });
    });

    test('Toggle', async () => {
        const user = await put({url: "/user/toggle", session, data: { username: "user" } });
        expect(user).toBeTruthy();
        expect(user.enabled).toBe(true);
    });
  
    test('Login: Wrong Password', async () => {
        await post({url: "/auth", data: { username: 'user', password: 'X' }, expectStatus: 401 });
    });

    test('Login: Enabled', async () => {
        const { id } = await post({url: "/auth", data: { username: 'user', password: 'password' } });
        expect(id).toBeTruthy();
        expect(id).toBeTypeOf("string");
    });

    test('Permissions', async () => {
        const { id } = await post({url: "/auth", data: { username: 'user', password: 'password' } });
        expect(id).toBeTruthy();
        await del({url: "/user", session: id, data: { username: "user" }, expectStatus: 403 });
    });

    test('Delete', async () => {
        const deleted = await del({url: "/user", session, data: { username: "user" } });
        expect(deleted).toBeTruthy();
        const users = await get({url: "/user", session });
        expect(users).toBeTruthy();
        expect(users.length).toBe(1);
    });

    afterAll(async () => {
        await clear();
    });
  
  });