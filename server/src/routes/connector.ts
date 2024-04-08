import { FastifyInstance } from "fastify";
import { xError } from "../modules/common.js";
import { schemas2 } from "./schema.js";
import { Connector } from "../components/models.js";

export default async function (route: FastifyInstance) {
    // Change Connector Order
    route.put('/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { from, to } = request.body as { from: number, to: number };
        try {
            const schema = schemas2.get(schema_name);
            const copy = [...schema.connectors];
            copy[to] = schema.connectors[from];
            copy[from] = schema.connectors[to];
            schema.connectors = copy;
            return schema.parse().connectors;
        } catch (e) { throw new xError(e).send(reply); }
    });
    // Change Connector
    route.put('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { connector, force, save, name } = request.body as { force: boolean, save: boolean, name: string, connector: Connector };
        try {
            const schema = schemas2.get(schema_name);
            const temp = new Connector(connector, schema);
            try { await temp.validate(); }
            catch (e) { if (!force) throw new xError(e).send(reply);  }
            if (!save) return schema.parse().connectors;
            schema.connnector(name).mutate(connector);
            return schema.parse().connectors;
        } catch (e) { throw new xError(e).send(reply); }
    });
    // Test Connector
    route.put('/test', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const schema = schemas2.get(schema_name);
            await schema.connnector(name).validate();
            return schema.parse().connectors;
        } catch (e) { throw new xError(e).send(reply); }
    });
    // Delete Connector
    route.delete('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const schema = schemas2.get(schema_name);
            schema.connnector(name).destroy();
            return schema.parse().connectors;
        }
        catch (e) { throw new xError(e).send(reply); }
    });
}