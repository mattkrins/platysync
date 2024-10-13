import { FastifyInstance } from "fastify";
import { isNotEmpty, validate, xError } from "../../modules/common";
import database, { getDictionary, sync } from "../../components/database";
import { log } from "../../..";

export default async function (route: FastifyInstance) {
    route.get('/', async (request, reply) => {
        try { return await getDictionary(); }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('/reorder', async (request, reply) => {
        const { to, from } = request.body as { to: number, from: number };
        try {
            const array = await getDictionary();
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
        const { key, value } = request.body as kvPair;
        try {
            validate( { key, value }, {
                key: isNotEmpty('Key can not be empty.'),
                value: isNotEmpty('Value can not be empty.'),
            });
            const entry = await getDictionary();
            if (entry.find(c=>c.key===key)) throw new xError("Key taken.", "name", 409);
            entry.push({ key, value });
            await sync();
            log.silly({message: "Global dictionary entry created", entry: key });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', async (request, reply) => {
        const { editing } = request.params as { editing: string };
        const { key, value } = request.body as kvPair;
        try {
            validate( { key, value }, {
                key: isNotEmpty('Key can not be empty.'),
                value: isNotEmpty('Value can not be empty.'),
            });
            const databaseData = (await database()).data
            const entry = databaseData.dictionary.find(f=>f.key===editing);
            if (!entry) throw new xError("Global dictionary entry not found.", "name", 404 );
            if (editing!==key){
                if (databaseData.dictionary.find(c=>c.key===key)) throw new xError("Key taken.", "name", 409);
            }
            databaseData.dictionary = databaseData.dictionary.map(c=>c.key!==editing?c:{...c, key, value })
            await sync();
            log.silly({message: "Global dictionary entry modified", entry: key });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:key/copy', async (request, reply) => {
        const { key } = request.params as { key: string };
        try {
            validate( { key }, {
                key: isNotEmpty('Key can not be empty.'),
            });
            const dictionary = await getDictionary();
            const entry = dictionary.find(c=>c.key===key);
            if (!entry) throw new xError("Global dictionary entry not found.", "name", 404 );
            const newName = `${entry.key}_copy${dictionary.length}`;
            const nameCheck = dictionary.find(c=>c.key===newName);
            if (nameCheck) throw new xError("Entry name taken.", "name", 409 );
            dictionary.push({...entry, key: newName });
            await sync();
            log.silly({message: "Global dictionary entry copied", entry: key });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request, reply) => {
        const { key } = request.body as { key: string };
        try {
            const databaseData = (await database()).data
            const entry = databaseData.dictionary.find(f=>f.key===key);
            if (!entry) throw new xError("Global dictionary entry not found.", "name", 404 );
            databaseData.dictionary = databaseData.dictionary.filter(f=>f.key!==key);
            await sync();
            log.silly({message: "Global dictionary entry deleted", entry: key });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}