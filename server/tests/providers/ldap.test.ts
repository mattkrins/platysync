import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { clear, del, post, put } from '../test.setup.ts';
import { init } from '../../src/server.ts';
import { Connector, Rule, Rules } from '../../src/components/models.ts';

describe.sequential('Provider Suite: LDAP', () => {

    const connectorData = {
        name: "ldap",
        id: "ldap",
        url: "ldap://ldap.forumsys.com:389",
        username: "cn=read-only-admin,dc=example,dc=com",
        password: "password",
        dse: "dc=example,dc=com",
        attributes: ['uid']
    };

    let session: string;
    beforeAll(async () => {
        await init();
        const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin' } });
        session = id;
        await post({url: "/schema", session, data: { name: "Test" } });
    });
  
    test('Validate Connector', async () => {
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data: { connector: connectorData, force: false, save: false } });
        expect(connectors).toBeTruthy();
    });
  
    test('Add Connector', async () => {
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data: { connector: connectorData, force: false, save: true } });
        expect(connectors).toBeTruthy();
        expect(connectors.length).toBeGreaterThan(0);
        const connector = connectors.find(c=>c.name==="ldap");
        expect(connector?.name).toBe("ldap");
    });

    test('Test Connector', async () => {
        const connectors = await put({url: "/schema/Test/connector/test", session, data: { name: 'ldap' } });
        expect(connectors).toBeTruthy();
    });

    test('Update Connector', async () => {
        const data = { name: "ldap", connector: { ...connectorData, attributes: [], }, force: false, save: false };
        const connectors = await put({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
    });

    test('Copy Connector', async () => {
        const connectors = await post({url: "/schema/Test/connector/copy", session, data: { name: "ldap" } });
        expect(connectors).toBeTruthy();
        const connector = connectors.find(c=>c.name==="ldap_1");
        expect(connector).toBeTruthy();
    });

    test('Delete Connector', async () => {
        const connectors: Connector[] = await del({url: "/schema/Test/connector", session, data: { name: "ldap_1" } });
        expect(connectors).toBeTruthy();
        const connector = connectors.find(c=>c.name==="ldap_1");
        expect(connector).toBeUndefined();
    });

    test('Create Rule', async () => {
        const data = { rule: {
            name: 'ldap',
            primary: 'ldap',
            primaryKey: 'uid',
            display: '{{ldap.uid}}',
            test: true,
            conditions: [
                { type: 'string', key: '1', operator: '==', value: '1', }
            ],
        }}
        const rules: Rule[] = await post({url: "/schema/Test/rule", session, data });
        expect(rules).toBeTruthy();
        const rule = rules.find(c=>c.name==="ldap");
        expect(rule).toBeTruthy();
        expect(rule?.primaryKey).toBe("uid");
    });

    test('Evaluate Rule', async () => {
        const rules = new Rules("Test");
        const data = rules.get("ldap").parse();
        const results = await post({url: "/schema/Test/engine", session, data });
        expect(results).toHaveProperty("evaluated");
        expect(results.evaluated.length).toBeGreaterThan(0);
        expect(results.evaluated[0]).toEqual({ id: 'newton', actions: [], actionable: true, display: 'newton' });
    });
  
    afterAll(async () => {
        await clear();
    });
  
  });