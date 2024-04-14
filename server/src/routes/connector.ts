import { FastifyInstance } from "fastify";
import { xError } from "../modules/common.js";
import { Connector, Connectors } from "../components/models.js";

export default async function (route: FastifyInstance) {
    // Create Connector
    route.post('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { connector, force, save } = request.body as { force: boolean, save: boolean, connector: Connector };
        try {
            const connnectors = new Connectors(schema_name);
            await connnectors.create(connector, force, save);
            return connnectors.parse();
        } catch (e) { throw new xError(e).send(reply); }
    });
    // Copy Connector
    route.post('/copy', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const connnectors = new Connectors(schema_name);
            const connector = connnectors.get(name);
            await connnectors.create({...connector, name: `${connector.name}_${connnectors.getAll().length}` }, true, true );
            return connnectors.parse();
        } catch (e) { throw new xError(e).send(reply); }
    });
    // Change Connector Order
    route.put('/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { from, to } = request.body as { from: number, to: number };
        try {
            const connnectors = new Connectors(schema_name);
            connnectors.reorder(from, to);
            return connnectors.parse();
        } catch (e) { throw new xError(e).send(reply); }
    });
    // Change Connector
    route.put('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { connector, force, save, name } = request.body as { force: boolean, save: boolean, name: string, connector: Connector };
        try {
            const connnectors = new Connectors(schema_name);
            await connnectors.mutate(connector, force, save, name);
            return connnectors.parse();
        } catch (e) { throw new xError(e).send(reply); }
    });
    // Test Connector
    route.put('/test', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const connnectors = new Connectors(schema_name);
            await connnectors.get(name).validate();
            return connnectors.parse();
        } catch (e) { throw new xError(e).send(reply); }
    });
    // Delete Connector
    route.delete('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const connnectors = new Connectors(schema_name);
            connnectors.get(name).destroy();
            return connnectors.parse();
        }
        catch (e) { throw new xError(e).send(reply); }
    });
}