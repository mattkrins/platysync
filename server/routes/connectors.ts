import { FastifyInstance } from "fastify";
import { xError } from "../modules/common";
import { getConnectors } from "../components/database";

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try { return await getConnectors(schema_name); }
        catch (e) { new xError(e).send(reply); }
    });
}