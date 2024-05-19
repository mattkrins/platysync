import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { clear, del, post, put } from '../test.setup.ts';
import { init, path } from '../../src/server.ts';
import { Connector, Rule, Rules } from '../../src/components/models.ts';

describe.sequential('Provider Suite: Folder', () => {

    let session: string;
    beforeAll(async () => {
        await init();
        const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin' } });
        session = id;
        await post({url: "/schema", session, data: { name: "Test" } });
    });
  
    test('Validate Connector', async () => {
        const data = { connector: { name: "folder", id: "folder", path: `${path}/schemas`, type: "file" }, force: false, save: false };
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
    });
  
    test('Add Connector', async () => {
        const data = { connector: { name: "folder", id: "folder", path: `${path}/schemas`, type: "file" }, force: false, save: true };
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
        expect(connectors.length).toBeGreaterThan(0);
        const connector = connectors.find(c=>c.name==="folder");
        expect(connector?.name).toBe("folder");
    });

    test('Test Connector', async () => {
        const connectors = await put({url: "/schema/Test/connector/test", session, data: { name: 'folder' } });
        expect(connectors).toBeTruthy();
    });

    test('Update Connector', async () => {
        const data = { name: "folder", connector: { name: "folder", id: "folder", path: `${path}/logs`, }, force: false, save: false };
        const connectors = await put({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
    });

    test('Copy Connector', async () => {
        const connectors = await post({url: "/schema/Test/connector/copy", session, data: { name: "folder" } });
        expect(connectors).toBeTruthy();
        const connector = connectors.find(c=>c.name==="folder_1");
        expect(connector).toBeTruthy();
    });

    test('Delete Connector', async () => {
        const connectors: Connector[] = await del({url: "/schema/Test/connector", session, data: { name: "folder_1" } });
        expect(connectors).toBeTruthy();
        const connector = connectors.find(c=>c.name==="folder_1");
        expect(connector).toBeUndefined();
    });

    test('Create Rule', async () => {
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
        const rules: Rule[] = await post({url: "/schema/Test/rule", session, data });
        expect(rules).toBeTruthy();
        const rule = rules.find(c=>c.name==="folder");
        expect(rule).toBeTruthy();
        expect(rule?.primaryKey).toBe("name");
    });

    test('Evaluate Rule', async () => {
        const rules = new Rules("Test");
        const data = rules.get("folder").parse();
        const results = await post({url: "/schema/Test/engine", session, data });
        expect(results).toHaveProperty("evaluated");
        expect(results.evaluated).toContainEqual({ id: 'Test.yaml', actions: [], display: 'file', actionable: true });
    });
  
    afterAll(async () => {
        await clear();
    });
  
  });