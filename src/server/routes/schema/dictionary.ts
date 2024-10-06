import { FastifyInstance } from "fastify";
import { isNotEmpty, validate, xError } from "../../modules/common";
import { getSchemaDictionary, getSchema, sync } from "../../components/database";
import { log } from "../../..";

export default async function (route: FastifyInstance) {
    route.get('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try { return await getSchemaDictionary(schema_name); }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('s/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { to, from } = request.body as { to: number, from: number };
        try {
            const array = await getSchemaDictionary(schema_name);
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
        const { key, value } = request.body as dictionaryEntry;
        try {
            validate( { key, value }, {
                key: isNotEmpty('Key can not be empty.'),
                value: isNotEmpty('Value can not be empty.'),
            });
            const entry = await getSchemaDictionary(schema_name);
            if (entry.find(c=>c.key===key)) throw new xError("Key taken.", "name", 409);
            entry.push({ key, value });
            await sync();
            log.silly({message: "Schema dictionary entry created", entry: key, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', async (request, reply) => {
        const { schema_name, editing } = request.params as { schema_name: string, editing: string };
        const { key, value } = request.body as dictionaryEntry;
        try {
            validate( { key, value }, {
                key: isNotEmpty('Key can not be empty.'),
                value: isNotEmpty('Value can not be empty.'),
            });
            const schema = await getSchema(schema_name);
            const entry = schema.dictionary.find(f=>f.key===editing);
            if (!entry) throw new xError("Schema dictionary entry not found.", "name", 404 );
            if (editing!==key){
                if (schema.dictionary.find(c=>c.key===key)) throw new xError("Key taken.", "name", 409);
            }
            schema.dictionary = schema.dictionary.map(c=>c.key!==editing?c:{...c, key, value })
            await sync();
            log.silly({message: "Schema dictionary entry modified", entry: key, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:name/copy', async (request, reply) => {
        const { schema_name, key } = request.params as { schema_name: string, key: string };
        try {
            validate( { key }, {
                key: isNotEmpty('Key can not be empty.'),
            });
            const dictionary = await getSchemaDictionary(schema_name);
            const entry = dictionary.find(c=>c.key===key);
            if (!entry) throw new xError("Schema dictionary entry not found.", "name", 404 );
            const newName = `${entry.key}_copy${dictionary.length}`;
            const nameCheck = dictionary.find(c=>c.key===newName);
            if (nameCheck) throw new xError("Entry name taken.", "name", 409 );
            dictionary.push({...entry, key: newName });
            await sync();
            log.silly({message: "Schema dictionary entry copied", entry: key, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { key } = request.body as { schema_name: string, key: string };
        try {
            const schema = await getSchema(schema_name);
            const entry = schema.dictionary.find(f=>f.key===key);
            if (!entry) throw new xError("Schema dictionary entry not found.", "name", 404 );
            schema.dictionary = schema.dictionary.filter(f=>f.key!==key);
            await sync();
            log.silly({message: "Schema dictionary entry deleted", entry: key, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}