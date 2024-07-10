import { FastifyInstance } from "fastify";
import { isNotEmpty, validate, xError } from "../modules/common";
import { getActions, getSchema, sync } from "../components/database";
import { encrypt } from "../modules/cryptography";

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try { return await getActions(schema_name); }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('s/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { to, from } = request.body as { to: number, from: number };
        try {
            const array = await getActions(schema_name);
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
        let { name, id, ...options } = request.body as ActionConfig;
        try {
            validate( { id, name }, {
                id: isNotEmpty('ID can not be empty.'),
                name: isNotEmpty('Name can not be empty.'),
            });
            if (options.password && typeof options.password === 'string' ) options.password = await encrypt(options.password as string);
            const actions = await getActions(schema_name);
            actions.push({ id, name, ...options });
            await sync();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', async (request, reply) => {
        const { schema_name, editing } = request.params as { schema_name: string, editing: string };
        const { id, name, ...options } = request.body as ActionConfig;
        try {
            validate( { id, name, editing }, {
                id: isNotEmpty('ID can not be empty.'),
                name: isNotEmpty('Name can not be empty.'),
            });
            const schema = await getSchema(schema_name);
            const action = schema.actions.find(f=>f.name===editing);
            if (!action) throw new xError("Action not found.", "name", 404 );
            if (editing!==name){
                if (schema.actions.find(c=>c.name===name)) throw new xError("Action name taken.", "name", 409);
            }
            if (options.password && typeof options.password === 'string' ) options.password = await encrypt(options.password as string);
            schema.actions = schema.actions.map(c=>c.name!==editing?c:{...c, name, ...options })
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
            const actions = await getActions(schema_name);
            const action = actions.find(c=>c.name===name);
            if (!action) throw new xError("Action not found.", "name", 404 );
            const newName = `${action.name}_copy${actions.length}`;
            const nameCheck = actions.find(c=>c.name===newName);
            if (nameCheck) throw new xError("Action name taken.", "name", 409 );
            actions.push({...action, name: newName });
            await sync();
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const schema = await getSchema(schema_name);
            const connector = schema.actions.find(f=>f.name===name);
            if (!connector) throw new xError("Action config not found.", "name", 404 );
            schema.actions = schema.actions.filter(f=>f.name!==name);
            await sync();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}