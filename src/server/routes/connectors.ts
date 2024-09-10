import { FastifyInstance } from "fastify";
import { hasLength, isAlphanumeric, isNotEmpty, validate, xError } from "../modules/common";
import { getConnectors, getSchema, sync } from "../components/database";
import { providers } from "../components/providers";
import { encrypt } from "../modules/cryptography";
import { log } from "../..";

function validateHeaders(headers: string[]) {
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
    validate( { headers }, {
        headers: hasLength({ min: 1 }, "Must have at least one header."),
    });
    for (const index in headers) {
        if (!headers[index]) throw new xError("Header can not be empty.", `headers.${index}` );
    }
    const duplicates = findDuplicateIndexes(headers);
    for (const index in duplicates) throw new xError("Duplicate header.", `headers.${index}` );
}

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
        const { id, name, ...options } = request.body as Connector;
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
            const provider = new providers[id]({ id, name, ...options, schema });
            await provider.initialize();
            await provider.validate();
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.post('/getHeaders', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { id, name, ...options } = request.body as Connector;
        try {
            validate( { id, name }, {
                id: isNotEmpty('Provider ID can not be empty.'),
                name: isAlphanumeric('Name can only contain alphanumeric characters.'),
            });
            const schema = await getSchema(schema_name);
            const provider = new providers[id]({ id, name, ...options, schema });
            await provider.initialize();
            await provider.configure();
            return await provider.getHeaders();
        } catch (e) { new xError(e).send(reply); }
    });
    route.post('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { id, name, headers, ...options } = request.body as Connector;
        try {
            validate( { id, name }, {
                id: isNotEmpty('Provider ID can not be empty.'),
                name: isAlphanumeric('Name can only contain alphanumeric characters.'),
            });
            validateHeaders(headers);
            const connectors = await getConnectors(schema_name);
            const connector = connectors.find(c=>c.name===name);
            if (connector) throw new xError("Connector name taken", 'name', 409);
            if (options.password && typeof options.password === 'string' ) options.password = await encrypt(options.password as string);
            options.type = options.type||"provider";
            connectors.push({ id, name, ...options, headers });
            await sync();
            log.silly({message: "Connector created", connector: name, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', async (request, reply) => {
        const { schema_name, editing } = request.params as { schema_name: string, editing: string };
        const { force } = request.query as { force: boolean };
        const { id, name, headers, ...options } = request.body as Connector;
        try {
            validate( { id, name }, {
                id: isNotEmpty('Provider ID can not be empty.'),
                name: isAlphanumeric('Name can only contain alphanumeric characters.'),
            });
            validateHeaders(headers);
            const schema = await getSchema(schema_name);
            const connector = schema.connectors.find(f=>f.name===editing);
            if (!connector) throw new xError("Connector not found.", "name", 404 );
            try {
                const provider = new providers[id]({ id, name, headers, ...options, schema });
                await provider.initialize();
                await provider.validate();
            } catch (e) { if (!force) throw new xError(e);  }
            if (editing!==name){
                if (schema.connectors.find(c=>c.name===name)) throw new xError("Connector name taken.", "name", 409);
            }
            if (options.password && typeof options.password === 'string' ) options.password = await encrypt(options.password as string);
            schema.connectors = schema.connectors.map(c=>c.name!==editing?c:{...c, name, ...options, headers })
            await sync();
            log.silly({message: "Connector modified", connector: name, schema: schema_name });
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:name/copy', async (request, reply) => {
        const { schema_name, name } = request.params as { schema_name: string, name: string };
        try {
            validate( { name }, {
                name: isNotEmpty('Connector name can not be empty.'),
            });
            const connectors = await getConnectors(schema_name);
            const connector = connectors.find(c=>c.name===name);
            if (!connector) throw new xError("Connector not found.", "name", 404 );
            const newName = `${connector.name}_copy${connectors.length}`;
            const nameCheck = connectors.find(c=>c.name===newName);
            if (nameCheck) throw new xError("Connector name taken.", "name", 409 );
            connectors.push({...connector, name: newName });
            await sync();
            log.silly({message: "Connector copied", connector: name, schema: schema_name });
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
            log.silly({message: "Connector deleted", connector: name, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}