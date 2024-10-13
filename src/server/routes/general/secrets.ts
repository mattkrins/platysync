import { FastifyInstance } from "fastify";
import { isNotEmpty, validate, xError } from "../../modules/common";
import database, { getSecrets, sync } from "../../components/database";
import { log } from "../../..";
import { encrypt } from "../../modules/cryptography";

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        try { return await getSecrets(); }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('s/reorder', async (request, reply) => {
        const { to, from } = request.body as { to: number, from: number };
        try {
            const array = await getSecrets();
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
        let { key, value } = request.body as kvPair;
        try {
            validate( { key, value }, {
                key: isNotEmpty('Key can not be empty.'),
                value: isNotEmpty('Value can not be empty.'),
            });
            const entry = await getSecrets();
            if (entry.find(c=>c.key===key)) throw new xError("Key taken.", "name", 409);
            const encrypted = await encrypt(value as string);
            entry.push({ key, value: encrypted });
            await sync();
            log.silly({message: "Global secret entry created", entry: key });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', async (request, reply) => {
        const { editing } = request.params as { editing: string };
        let { key, value } = request.body as { key: string, value: string|Hash };
        try {
            validate( { key }, {
                key: isNotEmpty('Key can not be empty.'),
            });
            const databaseData = (await database()).data
            const entry = databaseData.secrets.find(f=>f.key===editing);
            if (!entry) throw new xError("Global secret entry not found.", "name", 404 );
            if (editing!==key){
                if (databaseData.secrets.find(c=>c.key===key)) throw new xError("Key taken.", "name", 409);
            }
            if (value && typeof value === 'string' ) {
                const encrypted = await encrypt(value);
                value = encrypted;
            } else {
                value === entry.value;
            }
            databaseData.secrets = databaseData.secrets.map(c=>c.key!==editing?c:{...c, key, value: value as Hash });
            await sync();
            log.silly({message: "Global secret entry modified", entry: key });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:key/copy', async (request, reply) => {
        const { key } = request.params as { key: string };
        try {
            validate( { key }, {
                key: isNotEmpty('Key can not be empty.'),
            });
            const secrets = await getSecrets();
            const entry = secrets.find(c=>c.key===key);
            if (!entry) throw new xError("Global secret entry not found.", "name", 404 );
            const newName = `${entry.key}_copy${secrets.length}`;
            const nameCheck = secrets.find(c=>c.key===newName);
            if (nameCheck) throw new xError("Entry name taken.", "name", 409 );
            secrets.push({...entry, key: newName });
            await sync();
            log.silly({message: "Global secret entry copied", entry: key });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request, reply) => {
        const { key } = request.body as { key: string };
        try {
            const databaseData = (await database()).data
            const entry = databaseData.secrets.find(f=>f.key===key);
            if (!entry) throw new xError("Global secret entry not found.", "name", 404 );
            databaseData.secrets = databaseData.secrets.filter(f=>f.key!==key);
            await sync();
            log.silly({message: "Global secret entry deleted", entry: key });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}