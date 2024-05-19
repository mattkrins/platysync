import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { clear, del, get, post, put, wait } from './test.setup.ts';
import { init, history, path } from '../src/server.ts';
import Transport from 'winston-transport';

interface log { [k: string]: string }
const logs: log[] = [];
class CustomTransport extends Transport {
    constructor(opts={}) { super(opts); }
    log(info: log, callback: ()=>void) {
        logs.push(info);
        callback();
    }
}

describe.sequential('Schedule Suite', () => {

    let session: string;
    beforeAll(async () => {
        await init();
        const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin' } });
        session = id;
        await post({url: "/schema", session, data: { name: "Test" } });
        const connector = { connector: { name: "folder", id: "folder", path: `${path}/schemas`, type: "file" }, force: false, save: true };
        await post({url: "/schema/Test/connector", session, data: connector });
        const data = { rule: {
            name: 'folder',
            primary: 'folder',
            primaryKey: 'name',
            display: '{{folder.type}}',
            test: true,
            conditions: [
                { type: 'string', key: '1', operator: '==', value: '1', }
            ],
        }}
        await post({url: "/schema/Test/rule", session, data });
        const transport = new CustomTransport({});
        history.add(transport);
    });

    test('Add Schedule', async () => {
        const schedule = await post({url: "/schedule", session, data: { schema: "Test", rules: ["folder"], type: "cron", value: "*/2 * * * * *" } });
        expect(schedule).toBeTruthy();
        expect(schedule.schema).toBe("Test");
    });

    test('Get Schedules', async () => {
        const schedules = await get({url: "/schedule", session });
        expect(schedules).toBeTruthy();
        expect(schedules.length).toBeGreaterThan(0);
    });

    test('Copy Schedule', async () => {
        const schedules = await get({url: "/schedule", session });
        const data = {...schedules[0], rules: [] };
        await post({url: "/schedule/copy", session, data });
    });

    test('Update Schedule', async () => {
        const schedules = await get({url: "/schedule", session });
        const data = {...schedules[1], rules: [] };
        const schedule = await put({url: "/schedule", session, data });
        expect(schedule).toBeTruthy();
        expect(schedule.rules).toBe(null);
    });

    test('Delete Schedule', async () => {
        const schedules = await get({url: "/schedule", session });
        const deleted = await del({url: "/schedule", session, data: schedules[1] });
        expect(deleted).toBeTruthy();
    });

    test('Enable Schedule', async () => {
        const schedules = await get({url: "/schedule", session });
        const data = {...schedules[0], rules: [] };
        const schedule = await put({url: "/schedule/toggle", session, data });
        expect(schedule).toBeTruthy();
        expect(schedule.enabled).toBe(true);
        await wait(3000);
        expect(logs.length).toBeGreaterThan(1);
    });

    afterAll(async () => {
        await clear();
    });
  
  });