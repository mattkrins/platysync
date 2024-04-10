import { FastifyInstance } from "fastify";
import { xError } from "../modules/common.js";
import { Rules } from "../components/models.js";

export default async function (route: FastifyInstance) {
  // Copy Rule
  route.post('/copy', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const { name } = request.body as { name: string };
    try {
        const rules = new Rules(schema_name);
        const rule = rules.get(name);
        await rules.create({...rule, name: `${rule.name} (${rules.getAll().length})` }, true );
        return rules.parse();
    } catch (e) { throw new xError(e).send(reply); }
  });
  // Change Rule Order
  route.put('/reorder', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const { from, to } = request.body as { from: number, to: number };
    try {
      const rules = new Rules(schema_name);
      rules.reorder(from, to);
      return rules.parse();
    } catch (e) { throw new xError(e).send(reply); }
  });
  // Change Rule Order
  route.put('/toggle', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const { name } = request.body as { name: string };
    try {
      const rules = new Rules(schema_name);
      rules.get(name).toggle();
      return rules.parse();
    } catch (e) { throw new xError(e).send(reply); }
  });
  // Delete Connector
  route.delete('/', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const { name } = request.body as { name: string };
    try {
        const rules = new Rules(schema_name);
        rules.get(name).destroy();
        return rules.parse();
    }
    catch (e) { throw new xError(e).send(reply); }
  });
}
