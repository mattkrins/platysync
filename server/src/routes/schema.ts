import { FastifyInstance } from "fastify";
import { Schemas, Schema } from "../components/models.js";
import { xError } from "../modules/common.js";

export const _schemas = {}
export const schemas = []
export const getSchema: (a?:any,b?:any) => any = () => {}
export const mutateSchema: (a?:any) => any = () => {}
export const initSchemaCache: (a?:any) => any = () => {}

const schemas2 = new Schemas();

export default async function schema(route: FastifyInstance) {
  await schemas2.load();
  // Get all Schemas
  route.get('/', async () => schemas2.getAll(true) );
  // Create Schema
  route.post('/', async (request, reply) => {
    try { return schemas2.create(request.body as Schema).parse(); }
    catch (e) { new xError(e).send(reply); }
  });
  // Get Schema
  route.get('/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      try { return schemas2.get(name).parse(); }
      catch (e) { new xError(e).send(reply); }
  });
  // Change Schema
  route.put('/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      try { return schemas2.get(name).mutate(request.body as Schema).parse(); }
      catch (e) { new xError(e).send(reply); }
  });
  // Delete Schema
  route.delete('/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      try { return schemas2.get(name).destroy(); }
      catch (e) { new xError(e).send(reply); }
  });
}
