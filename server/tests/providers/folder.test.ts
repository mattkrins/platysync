import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { clear, del, post, put } from '../test.setup.ts';
import { init, path } from '../../src/server.ts';
import { Connector } from '../../src/components/models.ts';

describe.sequential('Provider Suite: Folder', () => {

    let session: string;
    beforeAll(async () => {
        await init("./build/test");
        const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin' } });
        session = id;
        await post({url: "/schema", session, data: { name: "Test" } });
    });
  
    test('Validate Connector', async () => {
        const data = { connector: { name: "folder", id: "folder", path, }, force: false, save: false };
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
    });
  
    test('Add Connector', async () => {
        const data = { connector: { name: "folder", id: "folder", path, }, force: false, save: true };
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
        const data = { name: "folder", connector: { name: "folder", id: "folder", path: `${path}/schemas`, }, force: false, save: false };
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
        const connectors: Connector[] = await del({url: "/schema/Test/connector", session, data: { name: "folder" } });
        expect(connectors).toBeTruthy();
        const connector = connectors.find(c=>c.name==="folder");
        expect(connector).toBeUndefined();
    });
  
    afterAll(async () => {
        await clear();
    });
  
  });