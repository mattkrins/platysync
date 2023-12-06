import { _Error } from "../server.js";
import { User, Session } from '../db/models.js';
import { decrypt } from '../modules/cryptography.js';
import { form, isNotEmpty } from '../components/validators.js';
export async function useAuth(route) {
    route.addHook('preHandler', async (request, reply) => {
        const session = await authed(request);
        if (!session)
            return reply.code(401).send({ error: "Unauthorized." });
        if (session.expiresAt) {
            const expires = new Date(session.expiresAt);
            const currentDate = new Date();
            if (currentDate >= expires)
                return reply.code(401).send({ error: "Session Expired." });
        }
    });
}
async function authed(request) {
    const { bearer } = request.params;
    if (bearer)
        return await Session.findOne({ where: { id: bearer } });
    const Bearer = (request.headers.authorization || "").trim().split("Bearer ");
    if (Bearer && Bearer[1])
        return await Session.findOne({ where: { id: Bearer[1] } });
    return false;
}
export async function login(user) {
    const oldSessions = await Session.findAll({ where: { UserUsername: user.username } });
    for (const session of oldSessions)
        session.destroy();
    const currentDate = new Date();
    const oneHourFromNow = new Date(currentDate.getTime() + (12 * 60 * 60 * 1000));
    const session = await Session.create({ UserUsername: user.username, expiresAt: oneHourFromNow });
    return { username: user.username, session: session.id, expires: oneHourFromNow };
}
export default function auth(route) {
    route.post('/', form({
        username: isNotEmpty('Username can not be empty.'),
        password: isNotEmpty('Password can not be empty.'),
    }), async (request, reply) => {
        try {
            const { username, password } = request.body;
            const user = await User.findOne({ where: { username } });
            if (!user)
                throw reply.code(401).send({ validation: { username: "Username or password incorrect.", password: "Username or password incorrect." } });
            const decrypted = await decrypt({ encrypted: user.password, iv: user.iv });
            if (password !== decrypted)
                throw reply.code(401).send({ validation: { username: "Username or password incorrect.", password: "Username or password incorrect." } });
            return await login(user);
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
    route.delete('/', async (request, reply) => {
        try {
            let result = 0;
            const { bearer } = request.params;
            if (bearer)
                result += await Session.destroy({ where: { id: bearer } });
            const Bearer = (request.headers.authorization || "").trim().split("Bearer ");
            if (Bearer && Bearer[1])
                result += await Session.destroy({ where: { id: Bearer[1] } });
            return result > 0;
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
}
