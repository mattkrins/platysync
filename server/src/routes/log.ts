import { FastifyInstance } from "fastify";
import { xError, getLogs } from "../modules/common.js";
import { log, history } from "../server.js";

export default async function (route: FastifyInstance) {
    route.get('/general', async (request, reply) => {
        try {
            const logs1 = await getLogs(log, {
                from: new Date(2022, 0, 0),
                fields: ['message', 'level', 'timestamp'],
                limit: 100,
            }) as { message: string }[];
            return logs1;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.get('/history', async (request, reply) => {
        try {
            const logs1 = await getLogs(history, {
                from: new Date(2022, 0, 0),
                fields: ['message', 'level', 'timestamp'],
                limit: 100,
            }) as { message: string }[];
            return logs1;
        }
        catch (e) { new xError(e).send(reply); }
    });
}