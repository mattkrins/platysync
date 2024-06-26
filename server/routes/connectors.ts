import { FastifyInstance } from "fastify";
import { isAlphanumeric, validate, xError } from "../modules/common";
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
        const { id, name, ...connector } = request.body as Connector;
        try {
            validate( { name }, {
                name: isAlphanumeric('Name can only contain alphanumeric characters.'),
            });
            const schema = await getSchema(schema_name);
            const provider = new providers[id]({ id, name, ...connector, schema });
            await provider.preConfigure();
            await provider.validate();
            
            return name;
        } catch (e) { new xError(e).send(reply); }
    });
}