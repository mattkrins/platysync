import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { clear, del, post, put } from '../test.setup.ts';
import { init } from '../../src/server.ts';
import { Connector } from '../../src/components/models.ts';

describe.sequential('Provider Suite: Email', () => {

    let session: string;
    beforeAll(async () => {
        await init();
        const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin' } });
        session = id;
        await post({url: "/schema", session, data: { name: "Test" } });
    });
  
    test('Validate Connector', async () => {
        const data = { connector: { name: "email", id: "email", host: "smtp-mail.outlook.com", username: "test", password: "test" }, force: false, save: false };
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
    });
  
    test('Add Connector', async () => {
        const data = { connector: { name: "email", id: "email", host: "smtp-mail.outlook.com", username: "test", password: "test" }, force: false, save: true };
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
        expect(connectors.length).toBeGreaterThan(0);
        const connector = connectors.find(c=>c.name==="email");
        expect(connector?.name).toBe("email");
    });

    test('Test Connector', async () => {
        const connectors = await put({url: "/schema/Test/connector/test", session, data: { name: 'email' } });
        expect(connectors).toBeTruthy();
    });

    test('Update Connector', async () => {
        const data = { name: "email", connector: { name: "email", id: "email", host: "smtp-mail.outlook.com", username: "test2", password: "test2" }, force: false, save: false };
        const connectors = await put({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
    });

    test('Copy Connector', async () => {
        const connectors = await post({url: "/schema/Test/connector/copy", session, data: { name: "email" } });
        expect(connectors).toBeTruthy();
        const connector = connectors.find(c=>c.name==="email_1");
        expect(connector).toBeTruthy();
    });

    test('Delete Connector', async () => {
        const connectors: Connector[] = await del({url: "/schema/Test/connector", session, data: { name: "email_1" } });
        expect(connectors).toBeTruthy();
        const connector = connectors.find(c=>c.name==="email_1");
        expect(connector).toBeUndefined();
    });
  
    afterAll(async () => {
        await clear();
    });
  
  });