import { FastifyInstance } from "fastify";
import { _Error } from "../server.js";
import { Doc } from "../db/models.js";


export default async function (route: FastifyInstance) {
    route.get('/', async (request, reply) => {
        try {
            return await Doc.findAll();
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
}