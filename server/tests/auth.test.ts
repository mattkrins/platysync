import { suite, expect, test } from 'vitest';
import { server } from '../src/server.ts';
import { setup } from './server.test.ts';

let sessionId: string|undefined;
export function session(timeout = 4000): Promise<string> {
    return new Promise((resolve, reject)=> {
      let counter = 0;
      const intervalId = setInterval(() => {
          counter += 100;
          if (sessionId) { clearInterval(intervalId); resolve(sessionId); }
          if (counter >= timeout) {
              clearInterval(intervalId);
              return reject("No session.");
          }
      }, 100);
    } );
}

suite('Auth Suite', () => {

  test('Login', async () => {
    await setup();
    const login = (await server.inject({ method: "post", url: "/api/v1/auth", body: { username: 'admin', password: 'admin', } })).json();
    expect(login).toBeTruthy();
    expect(login.username).toBe('admin');
    expect(login.id).toBeDefined();
    const loggedOut = (await server.inject({ method: "delete", url: "/api/v1/auth", headers: { Authorization : `Bearer ${login.id}` } })).json();
    expect(loggedOut).toBeTruthy();
    const login2 = (await server.inject({ method: "post", url: "/api/v1/auth", body: { username: 'admin', password: 'admin', } })).json();
    expect(login2).toBeTruthy();
    sessionId = login2.id as string;
    const authed = (await server.inject({ method: "get", url: "/api/v1/auth", headers: { Authorization : `Bearer ${sessionId}` } })).json();
    expect(authed).toBeTruthy();
    expect(authed.username).toBe('admin');
    expect(authed.id).toBeDefined();
  });

});