import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { clear, del, post, put } from '../test.setup.ts';
import { init } from '../../src/server.ts';
import { Connector } from '../../src/components/models.ts';

describe.sequential('Provider Suite: Folder', () => {

    let session: string;
    beforeAll(async () => {
        await init();
        const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin' } });
        session = id;
        await post({url: "/schema", session, data: { name: "Test" } });
    });
  
    test('Validate Connector', async () => {
        const data = { connector: {
            name: "ldap",
            id: "ldap",
            url: "ldap://ldap.forumsys.com:389",
            username: "cn=read-only-admin,dc=example,dc=com",
            password: "password",
            dse: "dc=example,dc=com",
            base: "ou=mathematicians",
        }, force: false, save: false };
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
    });
  
    //test('Add Connector', async () => {
    //    const data = { connector: { name: "folder", id: "folder", path, }, force: false, save: true };
    //    const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data });
    //    expect(connectors).toBeTruthy();
    //    expect(connectors.length).toBeGreaterThan(0);
    //    const connector = connectors.find(c=>c.name==="folder");
    //    expect(connector?.name).toBe("folder");
    //});


  
    afterAll(async () => {
        await clear();
    });
  
  });