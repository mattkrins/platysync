import { FastifyInstance, FastifyRequest } from "fastify";
import { version } from "../server.js";
import { User, Session } from '../db/models.js';
import { decrypt } from '../modules/cryptography.js';
import { validStr, xError } from "../modules/common.js";
import { userReq } from "../typings/common.js";

export async function useAuth(route: FastifyInstance){
    route.addHook('preHandler', async (request: userReq, reply) => {
        const session = await authed(request);
        if ( !session ) throw new xError("Unauthorized.", undefined, 401 ).send(reply);
        request.session = session;
        if (session.expiresAt){
            const expires = new Date(session.expiresAt);
            const currentDate = new Date();
            if (currentDate >= expires) throw new xError("Session Expired.", undefined, 401 ).send(reply);
        }
        const user = await User.findOne({ where: { username: session.UserUsername } });
        if (!user) throw new xError("Unknown user.", undefined, 404 ).send(reply);
        request.user = user;
    })
}

async function authed(request: FastifyRequest){
    const Bearer = ((request.headers||{}).authorization||"").trim().split("Bearer ");
    const { bearer: bearer1 } = (request.query||{}) as { bearer?: string };
    const { bearer: bearer2 } = (request.params||{}) as { bearer?: string };
    const id = (Bearer && Bearer[1]) || bearer1 || bearer2;
    if (id) return await Session.findOne({where: { id }});
    return null;
}

async function login(user: User) {
    await Session.destroy({where: {UserUsername: user.username  }});
    const expiresAt = new Date((new Date()).getTime() + (12 * 60 * 60 * 1000));
    const session = await Session.create({UserUsername: user.username, expiresAt });
    return { username: user.username, group: user.group, id: session.id, expires: expiresAt, version };
}

export default function auth(route: FastifyInstance) {
    route.get('/', async (request, reply) => {
        const session = await authed(request);
        try {
            if (!session) throw new xError("Unauthenticated.", undefined, 401 ).send(reply);
            const user = await User.findOne({ where: { username: session.UserUsername } });
            if (!user) throw new xError("Unknown user.", undefined, 404 ).send(reply);
            return { username: user.username, group: user.group, id: session.id, expires: session.expiresAt, version };
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('/', async (request, reply) => {
        const { username, password } = request.body as { username: string, password: string };
        if (!validStr(username)) throw new xError("Username can not be empty.", "username");
        if (!validStr(password)) throw new xError("Password can not be empty.", "password");
        try {
            const user = await User.findOne({ where: { username } });
            if (!user) throw new xError("Username or Password incorrect.", undefined, 401);
            if (!user.enabled) throw new xError("User is inactive.", undefined, 403);
            const decrypted = await decrypt({ encrypted: user.password, iv: user.iv });
            if (password!==decrypted) throw new xError("Username or Password incorrect.", undefined, 401);
            return await login(user);
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request, reply) => {
        const Bearer = ((request.headers||{}).authorization||"").trim().split("Bearer ");
        try {
            if (Bearer && Bearer[1]) await Session.destroy({where: { id: Bearer[1] }});
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.get('/setup', async (request, reply) => {
        try { return (await User.count())>0; }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('/setup', async (request, reply) => {
        const { username, password, collection } = request.body as { username: string, password: string, collection: boolean };
        if (!validStr(username)) throw new xError("Username can not be empty.", "username");
        if (!validStr(password)) throw new xError("Password can not be empty.", "password");
        try {
            if ((await User.count())>0) throw new xError("Setup has already been completed.", undefined, 403).send(reply);
            const user =  await User.create({ username, password, stats: collection||false, group: "admin" });
            return await login(user);
        }
        catch (e) { new xError(e).send(reply); }
    });
}