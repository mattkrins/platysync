import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { clear, del, get, post, put } from './test.setup.ts';
import { init, log, path } from '../src/server.ts';
import { settings } from '../src/routes/settings.ts';

describe.sequential('Settings Suite', () => {

    let session: string;
    beforeAll(async () => {
        await init();
        const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin' } });
        session = id;
        await post({url: "/schema", session, data: { name: "Test" } });
    });

    test('Update Setting: schemasPath', async () => {
        const data = {...settings, schemasPath: path};
        const update = await put({url: "/settings", session, data: data });
        expect(update).toBeTruthy();
        expect(update.schemasPath).toBe("./build/test");
        const schemas = await get({url: "/schema", session, data: data });
        expect(schemas).toStrictEqual([]);
    });

    test('Update Setting: logLevel', async () => {
        const data = {...settings, logLevel: "silly"};
        const update = await put({url: "/settings", session, data: data });
        expect(update).toBeTruthy();
        expect(update.logLevel).toBe("silly");
        expect(log.level).toBe("silly");
    });

    test('Reset Cache', async () => {
        const reset = await del({url: "/reset_cache", session });
        expect(reset).toBeTruthy();
    });

    test('Factory Reset', async () => {
        const reset = await del({url: "/reset_all", session });
        expect(reset).toBeTruthy();
    });
  
    afterAll(async () => {
        await clear();
    });
  
  });