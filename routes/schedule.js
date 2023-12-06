import { _Error } from "../server.js";
import { form, isNotEmpty, validate, isPathValid } from "../components/validators.js";
import { Schedule } from "../db/models.js";
import * as fs from 'fs';
import Cron from "croner";
import { _schemas } from "./schema.js";
import findMatches, { runActionFor } from "../components/rules.js";
const scheduled = {};
const monitored = {};
function disableSchedule(schedule) {
    if (schedule.monitor) {
        if (!monitored[schedule.id])
            return;
        console.log(`Watcher ${schedule.id} stopping.`);
        monitored[schedule.id].close();
        delete monitored[schedule.id];
    }
    else {
        if (!scheduled[schedule.id])
            return;
        console.log(`Cron job ${schedule.id} stopping.`);
        scheduled[schedule.id].stop();
        delete scheduled[schedule.id];
    }
}
async function runSchedule(schedule) {
    if (!schedule || !schedule.id || (!scheduled[schedule.id] && !monitored[schedule.id]))
        throw (Error("Invalid schedule."));
    try {
        const rules = JSON.parse(schedule.rules);
        if (!(schedule.schema in _schemas))
            throw (Error("Schema does not exist."));
        const schema = _schemas[schedule.schema];
        for (const rule of schema.rules) {
            if (!rule.enabled)
                continue;
            if (!rules.includes(rule.name))
                continue;
            const matches = await findMatches(schema, rule);
            const actionable = matches.filter(a => a.actionable).map(a => a.id);
            if (actionable.length <= 0)
                continue;
            await runActionFor(schema, rule, actionable);
        }
    }
    catch (e) {
        console.error(`Schedule ${schedule.id} failed to run: `, e);
    }
}
function enableSchedule(schedule) {
    if (!schedule.enabled)
        return;
    try {
        if (schedule.monitor) {
            //console.log(`Watcher ${schedule.id} monitoring`, schedule.monitor, 'for changes.');
            monitored[schedule.id] = fs.watch(schedule.monitor, async (eventname, filename) => {
                if (!filename || !eventname)
                    return;
                //console.log(`Watcher ${schedule.id} detected change to`, schedule.monitor);
                await runSchedule(schedule);
            });
            monitored[schedule.id].on('error', (error) => {
                console.error(`Watcher ${schedule.id} failure:`, error);
            });
        }
        else {
            //console.log(`Cron job ${schedule.id} scheduled for `, schedule.cron);
            scheduled[schedule.id] = Cron(schedule.cron, { timezone: "Australia/Victoria" }, async () => {
                //console.log(`Running Cron job ${schedule.id}.`);
                runSchedule(schedule);
            });
        }
    }
    catch (e) {
        console.error(`Schedule ${schedule.id} failed to initialize: `, e);
    }
}
async function init() {
    const schedules = await Schedule.findAll();
    for (const schedule of schedules) {
        if (schedule.enabled)
            enableSchedule(schedule);
    }
}
export default async function schedule(route) {
    init();
    route.get('/', async (request, reply) => {
        try {
            return await Schedule.findAll();
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
    route.put('/reorder', async (request, reply) => {
        const { from, to } = request.body;
        try {
            const schedule1 = await Schedule.findOne({ where: { index: from } });
            if (!schedule1)
                throw reply.code(404).send({ validation: { name: "Schedule index mismatch." } });
            const schedule2 = await Schedule.findOne({ where: { index: to } });
            if (!schedule2)
                throw reply.code(404).send({ validation: { name: "Schedule index mismatch." } });
            schedule1.index = to;
            schedule2.index = from;
            await schedule1.save();
            await schedule2.save();
            return await Schedule.findAll();
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
    route.post('/', form({
        schema: isNotEmpty('Schema can not be empty.'),
    }), async (request, reply) => {
        const { rules, type, ...body } = request.body;
        if (body.monitor === "")
            delete body.monitor;
        if (body.cron === "")
            delete body.cron;
        try {
            if (type === "Monitor") {
                delete body.cron;
                validate(body, {
                    monitor: isPathValid(),
                }, reply);
            }
            else {
                delete body.monitor;
            }
            const schedule = { ...body, rules: rules.length > 0 ? JSON.stringify(rules) : null };
            await Schedule.create(schedule);
            return await Schedule.findAll();
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
    route.delete('/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const schedule = await Schedule.findOne({ where: { id } });
            if (!schedule)
                throw reply.code(404).send({ validation: { name: "Schedule ID does not exist." } });
            disableSchedule(schedule);
            await schedule.destroy();
            return await Schedule.findAll();
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
    route.put('/:id/toggle', async (request, reply) => {
        const { id } = request.params;
        try {
            const schedule = await Schedule.findOne({ where: { id } });
            if (!schedule)
                throw reply.code(404).send({ validation: { name: "Schedule ID does not exist." } });
            schedule.enabled = !schedule.enabled;
            if (schedule.enabled) {
                enableSchedule(schedule);
            }
            else {
                disableSchedule(schedule);
            }
            await schedule.save();
            return await Schedule.findAll();
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
    route.put('/:id', async (request, reply) => {
        const { id } = request.params;
        const { rules, type, ...body } = request.body;
        if (body.monitor === "")
            delete body.monitor;
        if (body.cron === "")
            delete body.cron;
        try {
            const schedule = await Schedule.findOne({ where: { id } });
            if (!schedule)
                throw reply.code(404).send({ validation: { name: "Schedule ID does not exist." } });
            if (type === "Monitor") {
                delete body.cron;
                validate(body, {
                    monitor: isPathValid(),
                }, reply);
            }
            else {
                delete body.monitor;
            }
            disableSchedule(schedule);
            const newSchedule = {
                ...body,
                rules: rules.length > 0 ? JSON.stringify(rules) : null,
                monitor: type === "Schedule" ? null : body.monitor,
                cron: type === "Monitor" ? null : body.cron,
            };
            schedule.set(newSchedule);
            schedule.enabled = false;
            await schedule.save();
            return await Schedule.findAll();
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
}
