import { FastifyInstance } from "fastify";
import { getLogs, xError } from "../modules/common";
import winston from "winston";
import { log, history } from "../../server";

const loggers: { [k: string]: { logger: winston.Logger, fields: string[] } } = {};
function init() {
    loggers.general = { logger: log, fields: ['message', 'level', 'timestamp', 'stack'] };
    loggers.history = { logger: history, fields: ['message', 'level', 'timestamp', 'rule', 'schema', 'stack', 'evaluated'] };
}

interface query extends Log {
    limit: string;
    date?: string;
    count?: string;
}

export default async function logs(route: FastifyInstance) {
    route.get('/:endpoint', async (request, reply) => {
        if (!loggers.general) init();
        const { endpoint } = request.params as { endpoint: string };
        const { level, limit, date, message, schema, rule, count } = request.query as query;
        try {
            let log = loggers[endpoint];
            if (!log) throw new xError("No such log.", undefined, 404);
            const from = date?.split(",");
            let logs = await getLogs(log.logger, {
                from: from && from[0] ? new Date(from[0]) : new Date(2022, 0, 0),
                until: from && from[1] ? new Date(from[1]) : undefined,
                fields: log.fields,
                limit: parseInt(limit||"1000"),
            }) as Log[];
            logs = !message ? logs : logs.filter(l=>l.message.includes(message));
            logs = !schema ? logs : logs.filter(l=>l.schema===schema);
            logs = !rule ? logs : logs.filter(l=>l.rule===rule);
            logs = !level ? logs : level==="all" ? logs : logs.filter(l=>l.level===level);
            return (count&&count==='true') ? logs.length : logs;
        }
        catch (e) { new xError(e).send(reply); }
    });
}