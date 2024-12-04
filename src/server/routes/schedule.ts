import { FastifyInstance } from "fastify";
import { hasLength, isNotEmpty, validate, xError } from "../modules/common.js";
import { getSchedules, getSchema, sync } from "../components/database.js";
import { executeSchedule, initSchedule, stopSchedule } from "../components/schedules.js";
import { log } from "../../index.js";

export async function toggleSchedule(schema_name: string, name: string, enable = false) {
    const schedules = await getSchedules(schema_name);
    const schedule = schedules.find(c=>c.name===name);
    if (!schedule) throw new xError("Schedule not found.", "name", 404 );
    schedule.enabled = enable;
    await sync();
    if (enable) { await initSchedule(name, schema_name); } else { stopSchedule(name, schema_name); }
    log.silly({message: `Schedule ${enable?'enabled':'disabled'}`, schedule: name, schema: schema_name });
    return true;
}

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try { return await getSchedules(schema_name); }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('s/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { to, from } = request.body as { to: number, from: number };
        try {
            const array = await getSchedules(schema_name);
            const to_value = array[to];
            const from_value = array[from];
            array[from] = to_value;
            array[to] = from_value;
            await sync();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name, ...options } = request.body as Schedule;
        try {
            validate( { name, tasks: options.tasks, triggers: options.triggers }, {
                name: isNotEmpty('Name can not be empty.'),
                tasks: hasLength({ min: 1, max: 0 }, 'Tasks can not be empty.'),
                triggers: hasLength({ min: 1, max: 0 }, 'Triggers can not be empty.'),
            });
            const schedules = await getSchedules(schema_name);
            if (schedules.find(c=>c.name===name)) throw new xError("Schedule name taken.", "name", 409);
            if (options.failAfter && options.failAfter < 100) throw new xError("Invalid fail after range.", "failAfter", 406 );
            if (options.disableAfter && options.disableAfter < 1) throw new xError("Invalid disable after range.", "disableAfter", 406 );
            schedules.push({ name, ...options });
            await sync();
            await initSchedule(name, schema_name);
            log.silly({message: "Schedule created", schedule: name, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', async (request, reply) => {
        const { schema_name, editing } = request.params as { schema_name: string, editing: string };
        const { name, ...options } = request.body as Schedule;
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            const schema = await getSchema(schema_name);
            const schedule = schema.schedules.find(f=>f.name===editing);
            if (!schedule) throw new xError("Schedule not found.", "name", 404 );
            if (editing!==name){
                if (schema.schedules.find(c=>c.name===name)) throw new xError("Schedule name taken.", "name", 409);
            }
            if (options.failAfter && options.failAfter < 100) throw new xError("Invalid fail after range.", "failAfter", 406 );
            if (options.disableAfter && options.disableAfter < 1) throw new xError("Invalid disable after range.", "disableAfter", 406 );
            schema.schedules = schema.schedules.map(c=>c.name!==editing?c:{...c, name, ...options })
            await sync();
            stopSchedule(editing, schema_name);
            await initSchedule(name, schema_name);
            log.silly({message: "Schedule modified", schedule: name, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.get('/:name', async (request, reply) => {
        const { schema_name, name } = request.params as { schema_name: string, name: string };
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            await executeSchedule(name, schema_name);
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:name/copy', async (request, reply) => {
        const { schema_name, name } = request.params as { schema_name: string, name: string };
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            const schedules = await getSchedules(schema_name);
            const schedule = schedules.find(c=>c.name===name);
            if (!schedule) throw new xError("Schedule not found.", "name", 404 );
            const newName = `${schedule.name}_copy${schedules.length}`;
            const nameCheck = schedules.find(c=>c.name===newName);
            if (nameCheck) throw new xError("Schedule name taken.", "name", 409 );
            schedules.push({...schedule, name: newName, enabled: false });
            await sync();
            log.silly({message: "Schedule copied", schedule: name, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:name/enable', async (request, reply) => {
        const { schema_name, name } = request.params as { schema_name: string, name: string };
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            return await toggleSchedule(schema_name, name, true);
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:name/disable', async (request, reply) => {
        const { schema_name, name } = request.params as { schema_name: string, name: string };
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            return await toggleSchedule(schema_name, name, false);
        } catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const schema = await getSchema(schema_name);
            const action = schema.schedules.find(f=>f.name===name);
            if (!action) throw new xError("Schedule config not found.", "name", 404 );
            schema.schedules = schema.schedules.filter(f=>f.name!==name);
            await sync();
            stopSchedule(name, schema_name);
            log.silly({message: "Schedule deleted", schedule: name, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}