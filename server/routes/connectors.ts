import { FastifyInstance } from "fastify";
import { hasLength, validate, xError } from "../modules/common";
import { getConnectors, sync } from "../components/database";

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
    route.post('/', async (request, reply) => {
        const { name, ...connector } = request.body as Connector;
        try {
            validate( { name }, {
                name: hasLength(2, 'Name must be greater than 2 characters.'),
            });
            
            return name;
        } catch (e) { new xError(e).send(reply); }
    });
}