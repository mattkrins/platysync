import { FastifyInstance } from "fastify";
import { xError } from "../modules/common";
import { getSchema } from "../components/database";
import { engine } from "../components/engine";

export default async function (route: FastifyInstance) {
    route.post('/test', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const rule = request.body as Rule;
        try {
            const schema = await getSchema(schema_name);
            return await engine(rule, schema);
        }
        catch (e) { new xError(e).send(reply); }
    });
}