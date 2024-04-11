import { FastifyInstance } from "fastify";
import { xError } from "../modules/common.js";
import { Schedule } from "../db/models.js";

export default async function schedule(route: FastifyInstance) {
  // Get all Schedules
  route.get('/', async (request, reply) => {
    try { return await Schedule.findAll(); }
    catch (e) { new xError(e).send(reply); }
  });
}