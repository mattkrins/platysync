import { FastifyInstance } from "fastify";
import { isNotEmpty, validate, xError } from "../modules/common.js";
import { getBlueprints, getSchema, sync } from "../components/database.js";
import { log } from "../../index.js";
import { availableOperations } from "../components/operations.js";

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try { return await getBlueprints(schema_name); }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('s/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { to, from } = request.body as { to: number, from: number };
        try {
            const array = await getBlueprints(schema_name);
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
        const { name, id, ...options } = request.body as Action;
        try {
            validate( { id, name }, {
                id: isNotEmpty('ID can not be empty.'),
                name: isNotEmpty('Name can not be empty.'),
            });
            const blueprints = await getBlueprints(schema_name);
            if (blueprints.find(c=>c.name===name)) throw new xError("Blueprint name taken.", "name", 409);
            if (!(id in availableOperations)) throw new xError(`Unknown action '${id}'.`, "name", 404 );
            const operation = new availableOperations[id]({ name, id, ...options});
            await operation.post(options);
            blueprints.push({ id, name, ...options });
            await sync();
            log.silly({message: "Blueprint created", blueprint: name, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', async (request, reply) => {
        const { schema_name, editing } = request.params as { schema_name: string, editing: string };
        const { id, name, ...options } = request.body as Action;
        try {
            validate( { id, name, editing }, {
                id: isNotEmpty('ID can not be empty.'),
                name: isNotEmpty('Name can not be empty.'),
            });
            const schema = await getSchema(schema_name);
            const blueprint = schema.blueprints.find(f=>f.name===editing);
            if (!blueprint) throw new xError("Blueprint not found.", "name", 404 );
            if (editing!==name){
                if (schema.blueprints.find(c=>c.name===name)) throw new xError("Blueprint name taken.", "name", 409);
            }
            if (!(id in availableOperations)) throw new xError(`Unknown action '${id}'.`, "name", 404 );
            const operation = new availableOperations[id]({ name, id, ...options});
            await operation.put(options);
            schema.blueprints = schema.blueprints.map(c=>c.name!==editing?c:{...c, name, ...options })
            await sync();
            log.silly({message: "Blueprint modified", blueprint: name, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:name/copy', async (request, reply) => {
        const { schema_name, name } = request.params as { schema_name: string, name: string };
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            const blueprints = await getBlueprints(schema_name);
            const blueprint = blueprints.find(c=>c.name===name);
            if (!blueprint) throw new xError("Blueprint not found.", "name", 404 );
            const newName = `${blueprint.name}_copy${blueprints.length}`;
            const nameCheck = blueprints.find(c=>c.name===newName);
            if (nameCheck) throw new xError("Blueprint name taken.", "name", 409 );
            blueprints.push({...blueprint, name: newName });
            await sync();
            log.silly({message: "Blueprint copied", blueprint: name, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const schema = await getSchema(schema_name);
            const blueprint = schema.blueprints.find(f=>f.name===name);
            if (!blueprint) throw new xError("Blueprint config not found.", "name", 404 );
            schema.blueprints = schema.blueprints.filter(f=>f.name!==name);
            await sync();
            log.silly({message: "Blueprint deleted", blueprint: name, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}