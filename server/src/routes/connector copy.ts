import { FastifyInstance } from "fastify";
import { ExtError, _Error } from "../server.js";
import { getSchema, mutateSchema } from './schema.js'
import { validConnectorName } from "../components/validators.js";
import { form } from "../components/validators.js";
import { encrypt } from "../modules/cryptography.js";
import { AllProviderOptions, providers } from "../components/providers.js";
import { Schema } from "../typings/common.js";
import { findDependencies } from "../modules/common.js";

export default function connector(route: FastifyInstance) {
    route.post('/', form({
        name: validConnectorName(),
    }), async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            const body = request.body as AllProviderOptions;
            if (schema._connectors[body.name]) throw reply.code(409).send({ validation: { name: "Connector name taken." } });
            if (!providers[body.id]) throw Error("Unknown provider.");
            if (body.password) {
                const hash = await encrypt(body.password as string);
                body.password = hash;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const provider = new providers[body.id]({...body, schema} as any);
            try { await provider.validate(); } catch (e) { throw new ExtError(e).sendValidation(reply); }
            schema._connectors[body.name] = body;
            schema.connectors.push(body);
            schema.headers[body.name] = await provider.getHeaders();
            mutateSchema(schema);
            return {connectors: schema.connectors, _connectors: schema._connectors, headers: schema.headers };
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
    route.put('/:connector_name', form({
        name: validConnectorName(),
    }), async (request, reply) => {
        const { schema_name, connector_name } = request.params as { schema_name: string, connector_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            const body = request.body as AllProviderOptions;
            if (!providers[body.id]) throw Error("Unknown provider.");
            if (body.password && typeof body.password === "string") {
                const hash = await encrypt(body.password);
                body.password = hash;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const provider = new providers[body.id]({...body, schema} as any);
            try { await provider.validate(); } catch (e) { throw new ExtError(e).sendValidation(reply); }
            if (connector_name!==body.name){
                if (schema._connectors[body.name]) throw reply.code(409).send({ validation: { name: "Connector name taken." } });
                const dependencies = findDependencies(schema, connector_name, false, false);
                if (dependencies) throw reply.code(400).send({ validation: { name: `Found references to name '${connector_name}' in '${dependencies}'.` } });
                delete schema._connectors[connector_name];
                delete schema.headers[connector_name];
                schema._connectors[body.name] = body;
                schema.connectors = schema.connectors.filter(c=>c.name!==connector_name);
                schema.connectors.push(body);
            } else {
                schema._connectors[connector_name] = body;
                schema.connectors = schema.connectors.map(c=>c.name!==connector_name?c:body);
            }
            schema.headers[body.name] = await provider.getHeaders();
            mutateSchema(schema);
            return {connectors: schema.connectors, _connectors: schema._connectors, headers: schema.headers};
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
    route.post('/:connector_name/copy', async (request, reply) => {
        const { schema_name, connector_name } = request.params as { schema_name: string, connector_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            if (!schema._connectors[connector_name]) throw reply.code(404).send({ validation: { name: "Connector does not exist." } });
            const connector = schema._connectors[connector_name];
            const count = schema.connectors.filter(c=>c.name.includes(connector_name)).length;
            const newName = `${connector_name}_copy${count}`;
            const copy = { ...connector, name: newName };
            schema._connectors[newName] = copy;
            schema.connectors.push(copy);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const provider = new providers[connector.id]({...connector, schema} as any);
            schema.headers[connector.name] = await provider.getHeaders();
            mutateSchema(schema);
            return {connectors: schema.connectors, _connectors: schema._connectors, headers: schema.headers};
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
    route.post('/:connector_name/test', async (request, reply) => {
        const { schema_name, connector_name } = request.params as { schema_name: string, connector_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            if (!schema._connectors[connector_name]) throw reply.code(404).send({ validation: { name: "Connector does not exist." } });
            const connector = schema._connectors[connector_name];
            if (!providers[connector.id]) throw Error("Unknown provider.");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const provider = new providers[connector.id]({...connector, schema} as any);
            try { await provider.validate(); } catch (e) { throw new ExtError(e).sendValidation(reply); }
            return connector.name;
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
    route.delete('/:connector_name', async (request, reply) => {
        const { schema_name, connector_name } = request.params as { schema_name: string, connector_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            if (!schema._connectors[connector_name]) throw reply.code(404).send({ validation: { name: "Connector does not exist." } });
            const dependencies = findDependencies(schema, connector_name, false, false);
            if (dependencies) throw reply.code(400).send({ validation: { name: `Found references to name '${connector_name}' in rule '${dependencies}'.` } });
            delete schema._connectors[connector_name];
            schema.connectors = schema.connectors.filter(c=>c.name!==connector_name);
            delete schema.headers[connector_name];
            mutateSchema(schema);
            return {connectors: schema.connectors, _connectors: schema._connectors, headers: schema.headers};
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
}