import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { isNotEmpty, validate, xError } from "../modules/common";
import { decrypt, encrypt } from "../modules/cryptography";
import database, { getSetup } from "../components/database";
import { v4 as uuidv4 } from 'uuid';

export async function logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("auth", { path: "/", sameSite: "strict", httpOnly: true });
    if (!request.cookies || !request.cookies['auth']) throw new xError("Missing session ID.", null, 401);
    const db = await database();
    const { data: { sessions } } = db;
    const sessionId = request.cookies['auth'];
    delete sessions[sessionId];
    await db.write();
    return true;
}

async function login(reply: FastifyReply, username: string) {
    const db = await database();
    const { data: { sessions } } = db;
    const sessionId = uuidv4();
    reply.setCookie("auth", sessionId, { path: "/", sameSite: "strict", httpOnly: true }); //TODO - set expiry
    const expiresAt = new Date((new Date()).getTime() + (12 * 60 * 60 * 1000));
    for (const id of (Object.keys(sessions))) {
        if (sessions[id].username === username) delete sessions[id];
    }
    sessions[sessionId] = { username, expires: String(expiresAt), sessionId };
    await db.write();
    return { username, expires: String(expiresAt) };
}

export default async function auth(route: FastifyInstance) {
    if (!(await getSetup())) {
        route.post('/setup', async (request, reply) => {
            const { username, password, confirm } = request.body as { username: string, password: string, confirm: string };
            try {
                validate( { username, password }, {
                    username: isNotEmpty('Username can not be empty.'),
                    password: isNotEmpty('Password can not be empty.'),
                    confirm: () => password===confirm ? false : 'Passwords do not match.',
                });
                const db = await database();
                const { data: { users } } = db;
                if (users.length > 0) throw new xError("Setup already complete.", null, 401);
                const encrypted = await encrypt(password);
                users.push({username, password: JSON.stringify(encrypted) });
                await db.write();
                return login(reply, username);
            } catch (e) { new xError(e).send(reply); }
        });
    }
    route.get('/', async (request, reply) => {
        if (!request.cookies || !request.cookies['auth']) throw new xError("Missing session ID.", null, 401);
        const db = await database();
        const { data: { users, sessions } } = db;
        const sessionId = request.cookies['auth'];
        if (!(sessionId in sessions)) throw new xError("Invalid session.", null, 401);
        const session = sessions[sessionId];
        const user = users.find(u=>u.username===session.username);
        if (!user) throw new xError("Unknown user.", null, 401);
        return { ...session, sessionId };
    });
    route.delete('/', async (request, reply) => logout(request, reply) );
    route.post('/', async (request, reply) => {
        const { username, password } = request.body as User;
        try {
            validate( { username, password }, {
                username: isNotEmpty('Username can not be empty.'),
                password: isNotEmpty('Password can not be empty.'),
            });
            const db = await database();
            const { data: { users } } = db;
            const user = users.find(u=>u.username===username);
            if (!user) throw new xError("Username or Password incorrect.", null, 401);
            const decrypted = await decrypt(JSON.parse(user.password));
            if (password!==decrypted) throw new xError("Username or Password incorrect.", null, 401);
            return login(reply, username);
        } catch (e) { new xError(e).send(reply); }
    });
}