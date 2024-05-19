import { FastifyInstance } from "fastify";
import { validStr, xError } from "../modules/common.js";
import { Session, User } from "../db/models.js";
import { userReq } from "../typings/common.js";


export default async function (route: FastifyInstance) {
    route.addHook('preHandler', async (request: userReq, reply) => {
        if (!request.user) throw new xError("User not detected.", undefined, 401 ).send(reply);
        if (request.user.group!=="admin") throw new xError("Unauthorized group.", undefined, 403 ).send(reply);
    });
    // Get all Users
    route.get('/', async (request: userReq, reply) => {
        try { return (await User.findAll({ raw: true })).map(u=>({ username: u.username, group: u.group, enabled: u.enabled, stats: u.stats, createdAt: u.createdAt, updatedAt: u.updatedAt })); }
        catch (e) { new xError(e).send(reply); }
    });
    // Create New User
    route.post('/', async (request, reply) => {
        const { form } = request.body as { form: { username: string, password: string, group: string, stats: boolean, enabled: boolean } };
        try {
            if (!validStr(form.username)) throw new xError("Username can not be empty.", "name");
            if (!validStr(form.password)) throw new xError("Password can not be empty.", "password");
            const user = await User.findOne( { where: { username: form.username } } );
            if (user) throw new xError("Username taken.", 'username', 409 );
            return await User.create(form);
        }
        catch (e) { new xError(e).send(reply); }
    });
    async function protectAdmin(username: string): Promise<User> {
        const users = await User.findAll();
        const user = users.find(u=>u.username===username);
        if (!user) throw new xError("User not found.", undefined, 404 );
        if (user.group==="admin"&&(users.filter(u=>u.group==="admin").length<=1)) throw new xError("Delete/Disable of last admin not allowed.", undefined, 406 );
        return user;
    }
    // Modify User
    route.put('/', async (request: userReq, reply) => {
        const { editing, form: { username, ...form } } = request.body as { editing: User, form: { username: string, password?: string, group: string, stats: boolean, enabled: boolean, [k: string]: unknown } };
        try {
            if (!validStr(username)) throw new xError("Username can not be empty.", "name");
            const user = await User.findOne( { where: { username: editing.username } } );
            if (!user) throw new xError("User does not exist.", 'username', 404 );
            const rename = editing.username !== username;
            if (!form.password||form.password.trim()==="") delete form.password;
            if (!form.enabled) await protectAdmin(username);
            if (form.stats!=editing.stats&&request.user.username!==username) throw new xError("Can not change privacy of another user.", 'stats', 403 );
            if (rename) {
                const userE = await User.findOne( { where: { username } } );
                if (userE) throw new xError("Username taken.", 'username', 409 );
                form.username = username;
                return await User.update(form, { where: { username: editing.username } });
            }
            return await user.update(form);
        }
        catch (e) { new xError(e).send(reply); }
    });
    // Enable/Disable User
    route.put('/toggle', async (request: userReq, reply) => {
        const { username } = request.body as User;
        try {
            const user = await protectAdmin(username);
            user.enabled = !user.enabled;
            if (!user.enabled) await Session.destroy({where: { UserUsername: user.username }});
            return await user.save();
        }
        catch (e) { new xError(e).send(reply); }
    });
    // Delete User
    route.delete('/', async (request: userReq, reply) => {
        const { username } = request.body as User;
        try {
            const user = await protectAdmin(username);
            await Session.destroy({where: {UserUsername: user.username  }});
            return await user.destroy();
        }
        catch (e) { new xError(e).send(reply); }
    });
}
