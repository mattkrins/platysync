import { FastifyInstance } from "fastify";
import { isNotEmpty, validate, xError } from "../modules/common";
import database, { Users } from "../components/database";
import { encrypt } from "../modules/cryptography";
import { logout } from "./auth";
import { FastifyRequestX } from "../../server";

export default async function user(route: FastifyInstance) {
    route.get('/', async (request, reply) => {
        try {
            const users = await Users();
            return users.map(({username})=>({username}));
        } catch (e) { new xError(e).send(reply); }
    });
    route.post('/', async (request, reply) => {
        const { username, password, confirm } = request.body as { username: string, password: string, confirm: string };
        try {
            validate( { username, password, confirm }, {
                username: isNotEmpty('Username can not be empty.'),
                password: isNotEmpty('Password can not be empty.'),
                confirm: () => !password ? false : password===confirm ? false : 'Passwords do not match.',
            });
            const db = await database();
            const { data: { users } } = db;
            if (users.find(u=>u.username===username)) throw new xError("Username taken.", "username", 409);
            const encrypted = await encrypt(password);
            users.push({username, password: JSON.stringify(encrypted) });
            await db.write();
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', async (request: FastifyRequestX, reply) => {
        const { editing } = request.params as { editing: string };
        const { username, password, confirm } = request.body as { username: string, password: string, confirm: string };
        try {
            validate( { username, editing, confirm }, {
                username: isNotEmpty('Username can not be empty.'),
                editing: isNotEmpty('Username Param can not be empty.'),
                confirm: () => !password ? false : password===confirm ? false : 'Passwords do not match.',
            });
            const db = await database();
            const { data: { users } } = db;
            const user = users.find(u=>u.username===editing);
            if (!user) throw new xError("User not found.", "username", 404);
            if (password) {
                const encrypted = await encrypt(password);
                db.data.users = users.map(u=>u.username!==editing?u:({...u, password: JSON.stringify(encrypted) }));
                await db.write();
            }
            if (username !== editing) {
                if (users.find(u=>u.username===username)) throw new xError("Username taken.", "username", 409);
                db.data.users = users.map(u=>u.username!==editing?u:({...u, username }));
                await db.write();
                if (request.session?.username === editing){
                    await logout(request, reply);
                    return reply.code(401).send(true);
                }
            }
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request: FastifyRequestX, reply) => {
        const { username } = request.body as { username: string };
        try {
            validate( { username }, {
                username: isNotEmpty('Username can not be empty.'),
            });
            if (request.session?.username === username) throw new xError("Can not delete self.");
            const db = await database();
            const { data: { users } } = db;
            if (users.length<=1) throw new xError("Can not delete the final user.");
            const user = users.find(u=>u.username===username);
            if (!user) throw new xError("User not found.", "username", 404);
            db.data.users = users.filter(u=>u.username!==username);
            await db.write();
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
}