import { FastifyInstance } from "fastify";
import { history } from "../server.js";
import { xError, getLogs } from "../modules/common.js";
import { schemas as _schemas } from "./schema.js";
import { Schedule, User } from "../db/models.js";

export default async function (route: FastifyInstance) {
    route.get('/', async (request, reply) => {
        try {
            const logs1 = await getLogs(history, {
                from: new Date((new Date()).valueOf() - (24 * 60 * 60 * 1000)),
                fields: ['message']
            }) as { message: string }[];
            const evaluatedToday = (logs1||[]).filter(l=>l.message==="Evaluating Rule.").length;
            const executedToday = (logs1||[]).filter(l=>l.message==="Executing Rule.").length;
            const logs2 = await getLogs(history, {
                from: new Date(2022, 0, 0),
                fields: ['message']
            }) as { message: string }[];
            const totalEvaluations = (logs2||[]).filter(l=>l.message==="Evaluating Rule.").length;
            const totalExecutions = (logs2||[]).filter(l=>l.message==="Executing Rule.").length;
            const schemas = _schemas.getAll().map(s=>({
                name: s.name,
                connectors: s.connectors.length,
                rules: s.rules.length,
            }))
            const schedules = (await Schedule.findAll({ raw: true }))
            .map(s=>({...s, rules: (s.rules? JSON.parse(s.rules as unknown as string): []).length }))
            .sort((a, b) => a.index - b.index);
            const users = (await User.findAll({ raw: true })).map(u=>({ username: u.username, group: u.group, enabled: u.enabled }));
            return {
                evaluatedToday,
                executedToday,
                totalEvaluations,
                totalExecutions,
                schemas,
                schedules,
                users
            }
        }
        catch (e) { new xError(e).send(reply); }
    });
}