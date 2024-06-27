import { FastifyInstance } from "fastify";
import { hasLength, isAlphanumeric, isNotEmpty, validate, xError } from "../modules/common";
import { getConnectors, getSchema, sync } from "../components/database";
import { providers } from "../components/providers";

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try { return await getConnectors(schema_name); }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('s/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { to, from } = request.body as { to: number, from: number };
        try {
            const array = await getConnectors(schema_name);
            const to_value = array[to];
            const from_value = array[from];
            array[from] = to_value;
            array[to] = from_value;
            await sync();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('/validate', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { creating } = request.query as { creating: boolean };
        const { id, name, ...connector } = request.body as Connector;
        try {
            validate( { id, name }, {
                id: isNotEmpty('Provider ID can not be empty.'),
                name: isAlphanumeric('Name can only contain alphanumeric characters.'),
            });
            if (creating) {
                const connectors = await getConnectors(schema_name);
                const connector = connectors.find(c=>c.name===name);
                if (connector) throw new xError("Connector name taken", 'name', 409);
            }
            const schema = await getSchema(schema_name);
            const provider = new providers[id]({ id, name, ...connector, schema });
            await provider.preConfigure();
            await provider.validate();
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.post('/getHeaders', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { id, name, ...connector } = request.body as Connector;
        try {
            validate( { id, name }, {
                id: isNotEmpty('Provider ID can not be empty.'),
                name: isAlphanumeric('Name can only contain alphanumeric characters.'),
            });
            const schema = await getSchema(schema_name);
            const provider = new providers[id]({ id, name, ...connector, schema });
            await provider.preConfigure();
            await provider.configure();
            return await provider.getHeaders();
        } catch (e) { new xError(e).send(reply); }
    });
    route.post('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { id, name, headers, ...options } = request.body as Connector;
        const findDuplicateIndexes = (arr: string[]) => {
            const elementMap = new Map();
            const duplicateIndexes: number[] = [];
            arr.forEach((item, index) => {
              if (elementMap.has(item)) {
                duplicateIndexes.push(index);
              } else {
                elementMap.set(item, index);
              }
            });
            return duplicateIndexes;
        };
        try {
            validate( { id, name, headers }, {
                id: isNotEmpty('Provider ID can not be empty.'),
                name: isAlphanumeric('Name can only contain alphanumeric characters.'),
                headers: hasLength({ min: 1 }, "Must have at least one header."),
            });
            for (const index in headers) {
                if (!headers[index]) throw new xError("Header can not be empty.", `headers.${index}` );
            }
            const duplicates = findDuplicateIndexes(headers);
            for (const index in duplicates) throw new xError("Duplicate header.", `headers.${index}` );
            const connectors = await getConnectors(schema_name);
            const connector = connectors.find(c=>c.name===name);
            if (connector) throw new xError("Connector name taken", 'name', 409);
            connectors.push({ id, name, ...options, headers });
            await sync();
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const schema = await getSchema(schema_name);
            const connector = schema.connectors.find(f=>f.name===name);
            if (!connector) throw new xError("Connector not found.", "name", 404 );
            schema.connectors = schema.connectors.filter(f=>f.name!==name);
            await sync();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}