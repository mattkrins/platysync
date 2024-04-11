import { FastifyInstance } from "fastify";
import { xError } from "../modules/common.js";
import { Rules, Rule } from "../components/models.js";

export default async function (route: FastifyInstance) {
  // Create Rule
  route.post('/', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const { rule } = request.body as { rule: Rule };
    try {
        const rules = new Rules(schema_name);
        rules.create(rule, true );
        return rules.parse();
    } catch (e) { throw new xError(e).send(reply); }
  });
  // Copy Rule
  route.post('/copy', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const { name } = request.body as { name: string };
    try {
        const rules = new Rules(schema_name);
        const rule = rules.get(name);
        rules.create({...rule, name: `${rule.name} (${rules.getAll().length})` }, true );
        return rules.parse();
    } catch (e) { throw new xError(e).send(reply); }
  });
  // Change Rule Order
  route.put('/', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const { name, rule: changes } = request.body as { name: string, rule: Rule };
    try {
      const rules = new Rules(schema_name);
      const rule = rules.get(name);
      rule.mutate( changes );
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
  // Toogle Rule Status
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
