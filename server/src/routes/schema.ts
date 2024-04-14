import { FastifyInstance } from "fastify";
import { Schemas, Schema } from "../components/models.js";
import { xError } from "../modules/common.js";
import { Schedule } from "../db/models.js";
import { stop } from "./schedule.js";

export const schemas = new Schemas();

export default async function (route: FastifyInstance) {
  await schemas.load();
  // Get all Schemas
  route.get('/', async () => schemas.getAll(true) );
  // Create Schema
  route.post('/', async (request, reply) => {
    try { return schemas.create(request.body as Schema).parse(); }
    catch (e) { new xError(e).send(reply); }
  });
  // Get Schema
  route.get('/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      try { return schemas.get(name).parse(); }
      catch (e) { new xError(e).send(reply); }
  });
  // Change Schema
  route.put('/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      try { return schemas.get(name).mutate(request.body as Schema).parse(); }
      catch (e) { new xError(e).send(reply); }
  });
  // Delete Schema
  route.delete('/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      try {
        const schedules = await Schedule.findAll({ where: { schema: name } });
        for (const schedule of schedules) {
          if (schedule.enabled) await stop(schedule);
          await schedule.destroy();
        }
        return schemas.get(name).destroy();
      }
      catch (e) { new xError(e).send(reply); }
  });
  // Get Connector Headers
  route.get('/:name/headers', async (request, reply) => {
      const { name } = request.params as { name: string };
      try { return await schemas.get(name).headers(); }
      catch (e) { new xError(e).send(reply); }
  });
}
