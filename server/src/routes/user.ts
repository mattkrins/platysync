import { FastifyInstance } from "fastify";
import { xError } from "../modules/common.js";
import { User } from "../db/models.js";
import { userReq } from "../typings/common.js";


export default async function (route: FastifyInstance) {
    // Get all Users
    route.get('/', async (request: userReq, reply) => {
        if (!request.user) throw new xError("User not detected.", undefined, 401 ).send(reply);
        if (request.user.group!=="admin") throw new xError("Unauthorized group.", undefined, 403 ).send(reply);
        
        try { return (await User.findAll({ raw: true })).map(u=>({ username: u.username, group: u.group, enabled: u.enabled, stats: u.stats, createdAt: u.createdAt, updatedAt: u.updatedAt })); }
        catch (e) { new xError(e).send(reply); }
    });
}
