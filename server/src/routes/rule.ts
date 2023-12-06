import { FastifyInstance } from "fastify";
import { _Error } from "../server.js";
import { getSchema } from './schema.js'
import { path } from "../server.js";
import { writeYAML } from "../storage.js";
import { Rule } from "../typings/common.js";
import { form, isNotEmpty } from "../components/validators.js";
import findMatches, { runActionFor } from "../components/rules.js";

export function rules(route: FastifyInstance) {
    route.get('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            return schema.rules;
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
    route.put('/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try {
            const { from, to } = request.body as { from: number, to: number };
            const schema = getSchema(schema_name, reply);
            schema.rules.splice(to, 0, schema.rules.splice(from, 1)[0]);
            const filePath = `${path}/schemas/${schema.name}/rules.yaml`;
            writeYAML(schema.rules, filePath);
            return {rules: schema.rules};
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
    route.post('/match', async (request, reply) => {
      const { schema_name } = request.params as { schema_name: string, rule_name: string };
      try {
          const schema = getSchema(schema_name, reply);
          const body = request.body as Rule;
          if (!schema._rules[body.name]) throw reply.code(409).send({ validation: { name: "Rule does not exist." } });
          const rule = schema._rules[body.name];
          return await findMatches(schema, {...rule, conditions: body.conditions } );
      } catch (e) {
        const error = _Error(e);
        reply.code(500).send({ error: error.message });
      }
  });
    route.post('/run', async (request, reply) => {
      const { schema_name } = request.params as { schema_name: string, rule_name: string };
      try {
          const schema = getSchema(schema_name, reply);
          interface RuleExt extends Rule {
            matches: string[]
          }
          const body = request.body as RuleExt;
          if (!schema._rules[body.name]) throw reply.code(409).send({ validation: { name: "Rule does not exist." } });
          const rule = schema._rules[body.name];
          return await runActionFor(schema, {...rule, conditions: body.conditions }, body.matches );
      } catch (e) {
        const error = _Error(e);
        reply.code(500).send({ error: error.message });
      }
  });
}
export default function rule(route: FastifyInstance) {
    route.post('/', form({
        name: isNotEmpty('Name can not be empty.'),
        primary: isNotEmpty('Primary data source can not be empty.'),
        primaryKey: isNotEmpty('Primary data key can not be empty.'),
      }), async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            const body = request.body as Rule;
            if (schema._rules[body.name]) throw reply.code(409).send({ validation: { name: "Rule name taken." } });
            if (body.conditions.length<=0) throw reply.code(400).send({ message: "No conditions defined." });
            const filePath = `${path}/schemas/${schema.name}/rules.yaml`;
            schema._rules[body.name] = body;
            schema.rules.push(body);
            writeYAML(schema.rules, filePath);
            return {rules: schema.rules, _rules: schema._rules};
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
    route.put('/:rule_name', form({
        name: isNotEmpty('Name can not be empty.'),
        primary: isNotEmpty('Primary data source can not be empty.'),
        primaryKey: isNotEmpty('Primary data key can not be empty.'),
      }), async (request, reply) => {
        const { schema_name, rule_name } = request.params as { schema_name: string, rule_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            const body = request.body as Rule;
            if (!schema._rules[rule_name]) throw reply.code(404).send({ message: "Rule does not exist." });
            if (rule_name!==body.name){
                if (schema._rules[body.name]) throw reply.code(409).send({ validation: { name: "Rule name taken." } });
                delete schema._rules[rule_name];
                schema._rules[body.name] = body;
                schema.rules = schema.rules.filter(c=>c.name!==rule_name);
                schema.rules.push(body);
            } else {
                schema._rules[rule_name] = body;
                schema.rules = schema.rules.map(c=>c.name!==rule_name?c:body);
            }
            const filePath = `${path}/schemas/${schema.name}/rules.yaml`;
            writeYAML(schema.rules, filePath);
            return {rules: schema.rules, _rules: schema._rules};
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
    route.delete('/:rule_name', async (request, reply) => {
        const { schema_name, rule_name } = request.params as { schema_name: string, rule_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            if (!schema._rules[rule_name]) throw reply.code(404).send({ validation: { name: "Rule does not exist." } });
            const filePath = `${path}/schemas/${schema.name}/rules.yaml`;
            delete schema._rules[rule_name];
            schema.rules = schema.rules.filter(c=>c.name!==rule_name);
            writeYAML(schema.rules, filePath);
            return {rules: schema.rules, _rules: schema._rules};
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
    route.post('/:rule_name/copy', async (request, reply) => {
        const { schema_name, rule_name } = request.params as { schema_name: string, rule_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            const count = schema.rules.filter(r=>r.name.includes(rule_name)).length;
            const newName = `${rule_name} (copy ${count})`;
            if (!schema._rules[rule_name]) throw reply.code(404).send({ message: "Rule does not exist." });
            if (schema._rules[newName]) throw reply.code(409).send({ message: "Rule name taken." });
            const rule = schema._rules[rule_name];
            schema._rules[newName] = {...rule, name: newName};
            schema.rules.push({...rule, name: newName});
            const filePath = `${path}/schemas/${schema.name}/rules.yaml`;
            writeYAML(schema.rules, filePath);
            return {rules: schema.rules, _rules: schema._rules};
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
    route.put('/:rule_name/toggle', async (request, reply) => {
        const { schema_name, rule_name } = request.params as { schema_name: string, rule_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            if (!schema._rules[rule_name]) throw reply.code(404).send({ validation: { name: "Rule does not exist." } });
            const filePath = `${path}/schemas/${schema.name}/rules.yaml`;
            schema._rules[rule_name].enabled = !schema._rules[rule_name].enabled;
            schema.rules = schema.rules.map(c=>c.name!==rule_name?c:{...c, enabled: schema._rules[rule_name].enabled });
            writeYAML(schema.rules, filePath);
            return {rules: schema.rules, _rules: schema._rules};
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
}