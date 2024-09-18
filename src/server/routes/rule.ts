import { FastifyInstance } from "fastify";
import { isNotEmpty, validate, xError } from "../modules/common";
import { getRules, getSchema, sync } from "../components/database";
import evaluate from "../components/engine";
import pdfPrinter from "pdf-to-printer";
import unixPrint from "unix-print";
import { log, windows } from "../..";
import { encrypt } from "../modules/cryptography";

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
            if (windows) return (await pdfPrinter.getPrinters()).map(p=>p.name);
            return (await unixPrint.getPrinters()).map(p=>p.printer);
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('/evaluate', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { context, test, ...rule} = request.body as evalRule;
        try {
            log.silly({message: "Rule evaluate", rule: rule.name, schema: schema_name });
            const schema = await getSchema(schema_name);
            return await evaluate(rule, schema, undefined, false, test);
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('/execute', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { context, test, ...rule} = request.body as evalRule;
        try {
            log.silly({message: "Rule execute", rule: rule.name, schema: schema_name });
            const schema = await getSchema(schema_name);
            return await evaluate(rule, schema, context||[], false, false);
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
            const rules = await getRules(schema_name);
            if (rules.find(c=>c.name===name)) throw new xError("Rule name taken.", "name", 409);
            for (const source of options.sources||[]) {
                if (source.overrides.password && typeof source.overrides.password === 'string' ){
                    source.overrides.password = await encrypt(source.overrides.password as string);
                }
            }
            rules.push({ name, ...options });
            await sync();
            log.silly({message: "Rule created", rule: name, schema: schema_name });
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
            for (const source of options.sources||[]) {
                if (source.overrides.password && typeof source.overrides.password === 'string' ){
                    source.overrides.password = await encrypt(source.overrides.password as string);
                }
            }
            schema.rules = schema.rules.map(c=>c.name!==editing?c:{...c, name, ...options })
            await sync();
            log.silly({message: "Rule modified", rule: name, schema: schema_name });
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
            log.silly({message: "Rule copied", rule: name, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:name/enable', async (request, reply) => {
        const { schema_name, name } = request.params as { schema_name: string, name: string };
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            const rules = await getRules(schema_name);
            const rule = rules.find(c=>c.name===name);
            if (!rule) throw new xError("Rule not found.", "name", 404 );
            rule.enabled = true;
            await sync();
            log.silly({message: "Rule enabled", rule: name, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:name/disable', async (request, reply) => {
        const { schema_name, name } = request.params as { schema_name: string, name: string };
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            const rules = await getRules(schema_name);
            const rule = rules.find(c=>c.name===name);
            if (!rule) throw new xError("Rule not found.", "name", 404 );
            rule.enabled = false;
            await sync();
            log.silly({message: "Rule disabled", rule: name, schema: schema_name });
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
            log.silly({message: "Rule deleted", rule: name, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}
