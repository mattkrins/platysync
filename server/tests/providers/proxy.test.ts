import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { clear, del, post, put } from '../test.setup.ts';
import { init } from '../../src/server.ts';
import { Connector } from '../../src/components/models.ts';
import http from 'http';
import url from 'url';
import net from 'net';
import { IncomingMessage, ServerResponse } from 'http';

const requestHandler = (clientReq: IncomingMessage, clientRes: ServerResponse) => {
    const parsedUrl = url.parse(clientReq.url || '');
    const options: http.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port ? parseInt(parsedUrl.port) : 80,
        path: parsedUrl.path,
        method: clientReq.method,
        headers: clientReq.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
        if (proxyRes.statusCode) {
            clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(clientRes, { end: true });
        } else {
            clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
            clientRes.end('Proxy error: no status code');
        }
    });

    proxyReq.on('error', (err: Error) => {
        console.error('Proxy request error:', err);
        clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
        clientRes.end('Proxy error');
    });

    clientReq.pipe(proxyReq, { end: true });
};

const connectHandler = (req: IncomingMessage, clientSocket: net.Socket, head: Buffer) => {
    const { port, hostname } = new URL(`http://${req.url}`);
    const serverSocket = net.connect(Number(port) || 443, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
            'Proxy-agent: Node.js-Proxy\r\n' +
            '\r\n');
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
    });

    serverSocket.on('error', (err: Error) => {
        console.error('Server socket error:', err);
        clientSocket.end('HTTP/1.1 502 Bad Gateway\r\n');
    });
};

describe.sequential('Provider Suite: Proxy', () => {

    let session: string;
    beforeAll(async () => {
        await init();
        const { id } = await post({url: "/auth/setup", data: { username: 'admin', password: 'admin' } });
        session = id;
        await post({url: "/schema", session, data: { name: "Test" } });
        const httpServer1 = http.createServer(requestHandler);
        httpServer1.on('connect', connectHandler);
        httpServer1.listen(8080);
        const httpServer2 = http.createServer(requestHandler);
        httpServer2.on('connect', connectHandler);
        httpServer2.listen(8081);
    });
  
    test('Validate Connector', async () => {
        const data = { connector: { name: "proxy", id: "proxy", url: "http://localhost:8080" }, force: false, save: false };
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
    });

    test('Add Connector', async () => {
        const data = { connector: { name: "proxy", id: "proxy", url: "http://localhost:8080" }, force: false, save: true };
        const connectors: Connector[] = await post({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
        expect(connectors.length).toBeGreaterThan(0);
        const connector = connectors.find(c=>c.name==="proxy");
        expect(connector?.name).toBe("proxy");
    });

    test('Test Connector', async () => {
        const connectors = await put({url: "/schema/Test/connector/test", session, data: { name: 'proxy' } });
        expect(connectors).toBeTruthy();
    });

    test('Update Connector', async () => {
        const data = { name: "proxy", connector: { name: "proxy", id: "proxy", url: "http://localhost:8081" }, force: false, save: false };
        const connectors = await put({url: "/schema/Test/connector", session, data });
        expect(connectors).toBeTruthy();
    });

    test('Copy Connector', async () => {
        const connectors = await post({url: "/schema/Test/connector/copy", session, data: { name: "proxy" } });
        expect(connectors).toBeTruthy();
        const connector = connectors.find(c=>c.name==="proxy_1");
        expect(connector).toBeTruthy();
    });

    test('Delete Connector', async () => {
        const connectors: Connector[] = await del({url: "/schema/Test/connector", session, data: { name: "proxy_1" } });
        expect(connectors).toBeTruthy();
        const connector = connectors.find(c=>c.name==="proxy_1");
        expect(connector).toBeUndefined();
    });
  
    afterAll(async () => {
        await clear();
    });
  
  });