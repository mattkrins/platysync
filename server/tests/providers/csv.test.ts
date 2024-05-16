import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { clear, del, post, put } from '../test.setup.ts';
import { init, path } from '../../src/server.ts';
import { Connector, Rule, Rules } from '../../src/components/models.ts';
import * as fs from 'fs';

describe.sequential('Provider Suite: CSV', () => {

    const csv1_path = `${path}/cache/test1.csv`;
    const csv2_path = `${path}/cache/test2.csv`;
    let session: string;
    beforeAll(async () => {
        await init();
        const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin' } });
        session = id;
        await post({url: "/schema", session, data: { name: "Test" } });
        fs.writeFileSync(csv1_path, `Header1,Header2
Data1,Data2`, 'utf8');
        fs.writeFileSync(csv2_path, `Header1,Header2
Data1,Data2`, 'utf8');
    });
    
    test('Validate Connector', async () => {
        const data = { connector: { name: "csv", id: "csv", path: csv1_path, }, force: false, save: false };
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
    });

    test('Add Connector', async () => {
        const data = { connector: { name: "csv", id: "csv", path: csv1_path, }, force: false, save: true };
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
        expect(connectors.length).toBeGreaterThan(0);
        const connector = connectors.find(c=>c.name==="csv");
        expect(connector?.name).toBe("csv");
    });

    test('Test Connector', async () => {
        const connectors = await put({url: "/schema/Test/connector/test", session, data: { name: 'csv' } });
        expect(connectors).toBeTruthy();
    });

    test('Update Connector', async () => {
        const data = { name: "csv", connector: { name: "csv", id: "csv", path: csv2_path, }, force: false, save: false };
        const connectors = await put({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
    });

    test('Copy Connector', async () => {
        const connectors = await post({url: "/schema/Test/connector/copy", session, data: { name: "csv" } });
        expect(connectors).toBeTruthy();
        const connector = connectors.find(c=>c.name==="csv_1");
        expect(connector).toBeTruthy();
    });

    test('Delete Connector', async () => {
        const connectors: Connector[] = await del({url: "/schema/Test/connector", session, data: { name: "csv_1" } });
        expect(connectors).toBeTruthy();
        const connector = connectors.find(c=>c.name==="csv_1");
        expect(connector).toBeUndefined();
    });

    test('Create Rule', async () => {
        const data = { rule: {
            name: 'csv',
            primary: 'csv',
            primaryKey: 'Header1',
            display: '{{csv.Header2}}',
            test: true,
            conditions: [
                { type: 'string', key: '1', operator: '==', value: '1', }
            ],
        }}
        const rules: Rule[] = await post({url: "/schema/Test/rule", session, data });
        expect(rules).toBeTruthy();
        const rule = rules.find(c=>c.name==="csv");
        expect(rule).toBeTruthy();
        expect(rule?.primaryKey).toBe("Header1");
    });

    test('Evaluate Rule', async () => {
        const rules = new Rules("Test");
        const data = rules.get("csv").parse();
        const results = await post({url: "/schema/Test/engine", session, data });
        expect(results).toHaveProperty("evaluated");
        expect(results.evaluated).toContainEqual({ id: "Data1", actions: [], display: "Data2", actionable: true });
    });
    
    afterAll(async () => {
        await clear();
    });
  
  });