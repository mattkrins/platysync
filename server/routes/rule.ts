import { FastifyInstance } from "fastify";
import { isNotEmpty, validate, xError } from "../modules/common";
import { getRules, getSchema, sync } from "../components/database";
import evaluate from "../components/engine";
import pdfPrinter from "pdf-to-printer";
import unixPrint from "unix-print";
//TODO - implement unix print in action

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try { return await getRules(schema_name); }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('s/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { to, from } = request.body as { to: number, from: number };
        try {
            const array = await getRules(schema_name);
            const to_value = array[to];
            const from_value = array[from];
            array[from] = to_value;
            array[to] = from_value;
            await sync();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.get('/getPrinters', async (request, reply) => {
        try {
            const windows = process.platform === "win32";
            if (windows) return (await pdfPrinter.getPrinters()).map(p=>p.name);
            return (await unixPrint.getPrinters()).map(p=>p.printer);
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('/evaluate', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const rule = request.body as Rule;
        try {
            const schema = await getSchema(schema_name);
            return await evaluate(rule, schema);
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        let { name, ...options } = request.body as Rule;
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            const actionsLength = options.initActions.length+ options.iterativeActions.length + options.finalActions.length;
            if (actionsLength <= 0) throw new xError("Rules must have an action.", null, 406);
            const rules = await getRules(schema_name);
            if (rules.find(c=>c.name===name)) throw new xError("Rule name taken.", "name", 409);
            rules.push({ name, ...options });
            await sync();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', async (request, reply) => {
        const { schema_name, editing } = request.params as { schema_name: string, editing: string };
        let { name, ...options } = request.body as Rule;
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            const schema = await getSchema(schema_name);
            const rule = schema.rules.find(f=>f.name===editing);
            if (!rule) throw new xError("Rule not found.", "name", 404 );
            if (editing!==name){
                if (schema.rules.find(c=>c.name===name)) throw new xError("Rule name taken.", "name", 409);
            }
            schema.rules = schema.rules.map(c=>c.name!==editing?c:{...c, name, ...options })
            await sync();
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:name/copy', async (request, reply) => {
        const { schema_name, name } = request.params as { schema_name: string, name: string };
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            const rules = await getRules(schema_name);
            const rule = rules.find(c=>c.name===name);
            if (!rule) throw new xError("Rule not found.", "name", 404 );
            const newName = `${rule.name}_copy${rules.length}`;
            const nameCheck = rules.find(c=>c.name===newName);
            if (nameCheck) throw new xError("Rule name taken.", "name", 409 );
            rules.push({...rule, name: newName });
            await sync();
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const schema = await getSchema(schema_name);
            const rule = schema.rules.find(f=>f.name===name);
            if (!rule) throw new xError("Rule not found.", "name", 404 );
            schema.rules = schema.rules.filter(f=>f.name!==name);
            await sync();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}