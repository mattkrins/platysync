import { FastifyInstance } from "fastify";
import { xError, getLogs } from "../modules/common.js";
import { log, history, paths } from "../server.js";
import winston, { transports } from "winston";
import * as fs from 'fs';

interface Log {
  timestamp: string;
  level: string;
  message: string;
}
const loggers: { [k: string]: { logger: winston.Logger, fields: string[] } } = {};
function init() {
    loggers.general = { logger: log, fields: ['message', 'level', 'timestamp', 'stack'] };
    loggers.history = { logger: history, fields: ['message', 'level', 'timestamp', 'rule', 'schema', 'stack', 'evaluated'] };
}

export default async function (route: FastifyInstance) {
    route.get('/:name', async (request, reply) => {
        if (!loggers.general) init();
        const { name } = request.params as { name: string };
        const { level, limit, date } = request.query as { level: string, limit: string, date?: string };
        try {
            const log = loggers[name];
            if (!log) throw new xError("No such log.", undefined, 404);
            const from = date?.split(",");
            const logs = await getLogs(log.logger, {
                from: from && from[0] ? new Date(from[0]) : new Date(2022, 0, 0),
                until: from && from[1] ? new Date(from[1]) : undefined,
                fields: log.fields,
                limit: parseInt(limit),
            }) as Log[];
            const filtered = level==="all"?logs:logs.filter(l=>l.level===level);
            return filtered;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.delete('/:name', async (request, reply) => {
        if (!loggers.general) init();
        const { name } = request.params as { name: string };
        try {
            const log = loggers[name];
            if (!log) throw new xError("No such log.", undefined, 404);
            log.logger.clear();
            fs.truncateSync(`${paths.logs}/${name}.txt`);
            log.logger.add(new transports.File({ filename: `${paths.logs}/${name}.txt` }))
            log.logger.info("Log cleared.");
            return [{message: "Log cleared", level: "info", timestamp: new Date()}];
        }
        catch (e) { new xError(e).send(reply); }
    });
}