import { FastifyInstance } from "fastify";
import { isNotEmpty, validate, xError } from "../../modules/common";
import { getSchemaSecrets, getSchema, sync } from "../../components/database";
import { log } from "../../..";
import { encrypt } from "../../modules/cryptography";

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try { return await getSchemaSecrets(schema_name); }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('s/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { to, from } = request.body as { to: number, from: number };
        try {
            const array = await getSchemaSecrets(schema_name);
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
        let { key, value } = request.body as kvPair;
        try {
            validate( { key, value }, {
                key: isNotEmpty('Key can not be empty.'),
                value: isNotEmpty('Value can not be empty.'),
            });
            const entry = await getSchemaSecrets(schema_name);
            if (entry.find(c=>c.key===key)) throw new xError("Key taken.", "name", 409);
            const encrypted = await encrypt(value as string);
            entry.push({ key, value: encrypted });
            await sync();
            log.silly({message: "Schema secret entry created", entry: key, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', async (request, reply) => {
        const { schema_name, editing } = request.params as { schema_name: string, editing: string };
        let { key, value } = request.body as { key: string, value: string|Hash };
        try {
            validate( { key }, {
                key: isNotEmpty('Key can not be empty.'),
            });
            const schema = await getSchema(schema_name);
            const entry = schema.secrets.find(f=>f.key===editing);
            if (!entry) throw new xError("Schema secret entry not found.", "name", 404 );
            if (editing!==key){
                if (schema.secrets.find(c=>c.key===key)) throw new xError("Key taken.", "name", 409);
            }
            if (value && typeof value === 'string' ) {
                const encrypted = await encrypt(value);
                value = encrypted;
            } else {
                value === entry.value;
            }
            schema.secrets = schema.secrets.map(c=>c.key!==editing?c:{...c, key, value: value as Hash });
            await sync();
            log.silly({message: "Schema secret entry modified", entry: key, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:key/copy', async (request, reply) => {
        const { schema_name, key } = request.params as { schema_name: string, key: string };
        try {
            validate( { key }, {
                key: isNotEmpty('Key can not be empty.'),
            });
            const secrets = await getSchemaSecrets(schema_name);
            const entry = secrets.find(c=>c.key===key);
            if (!entry) throw new xError("Schema secret entry not found.", "name", 404 );
            const newName = `${entry.key}_copy${secrets.length}`;
            const nameCheck = secrets.find(c=>c.key===newName);
            if (nameCheck) throw new xError("Entry name taken.", "name", 409 );
            secrets.push({...entry, key: newName });
            await sync();
            log.silly({message: "Schema secret entry copied", entry: key, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { key } = request.body as { schema_name: string, key: string };
        try {
            const schema = await getSchema(schema_name);
            const entry = schema.secrets.find(f=>f.key===key);
            if (!entry) throw new xError("Schema secret entry not found.", "name", 404 );
            schema.secrets = schema.secrets.filter(f=>f.key!==key);
            await sync();
            log.silly({message: "Schema secret entry deleted", entry: key, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}