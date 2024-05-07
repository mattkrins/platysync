import { suite, expect, test } from 'vitest';
import { session } from './auth.test.ts';
import { del, post, put } from './test.setup.ts';
import { version } from '../src/server.ts';

suite('Schema Suite', async () => {
    
    test('Create', async () => {
        const schema = await post({url: "/schema", session, data: { name: "Test1" } });
        expect(schema).toBeTruthy();
        expect(schema.name).toBe('Test1');
        expect(schema.version).toBe(version);
    });

    test('Rename', async () => {
        const schema = await put({url: "/schema/Test1", session, data: { name: "Test2" } });
        expect(schema).toBeTruthy();
        expect(schema.name).toBe('Test2');
        expect(schema.version).toBe(version);
    });

    test('Delete', async () => {
        const deleted = await del({url: "/schema/Test2", session });
        expect(deleted).toBe(true);
    });

    test('Create', async () => {
        const schema = await post({url: "/schema", session, data: { name: "Test" } });
        expect(schema).toBeTruthy();
        expect(schema.name).toBe('Test');
        expect(schema.version).toBe(version);
    });

});