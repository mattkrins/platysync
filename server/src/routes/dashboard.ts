import { FastifyInstance } from "fastify";
import { _Error } from "../server.js";
import { form, isNotEmpty } from "../components/validators.js";
import { schemas } from "./schema.js";
import findMatches from "../components/rules.js";

export default async function dashboard(route: FastifyInstance) {
    route.post('/match', form({
        schema_name: isNotEmpty('Request can not be empty.'),
      }), async (request, reply) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let matches: any[] = [];
            const { schema_name } = request.body as { schema_name: string };
            for (const schema of schemas) {
                if (schema_name!=="all schemas" && schema_name!==schema.name) continue;
                for (const rule of schema.rules) {
                    if (!rule.enabled) continue;
                    const rule_matches = (await findMatches(schema, rule )).map(m=>({...m, rule: rule.name, schema: schema.name}));
                    matches = [...matches, ...rule_matches];
                }
            }
            return matches
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
}