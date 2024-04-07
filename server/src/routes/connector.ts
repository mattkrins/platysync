import { FastifyInstance } from "fastify";
import { xError } from "../modules/common.js";
import { schemas2 } from "./schema.js";

export default async function (route: FastifyInstance) {
    // Change Connector Order
    route.put('/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { from, to } = request.body as { from: number, to: number };
        try {
            const schema = schemas2.get(schema_name);
            const copy = [...schema.connnectors];
            copy[to] = schema.connnectors[from];
            copy[from] = schema.connnectors[to];
            schema.connnectors = copy;
            return schema.parse().connnectors;
        } catch (e) { new xError(e).send(reply); }
    });
    // Test Connector
    route.put('/test', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const schema = schemas2.get(schema_name);
            await schema.connnector(name).validate();
            return schema.parse().connnectors;
        } catch (e) { new xError(e).send(reply); }
    });
    // Delete Connector
    route.delete('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const schema = schemas2.get(schema_name);
            schema.connnector(name).destroy();
            return schema.parse().connnectors;
        }
        catch (e) { new xError(e).send(reply); }
    });
}