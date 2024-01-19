import { FastifyInstance } from "fastify";
import { _Error } from "../server.js";
import { getSchema } from './schema.js'
import { anyProvider } from "../typings/providers.js";
import { path } from "../server.js";
import { writeYAML } from "../storage.js";
import { validConnectorName, validators } from "../components/validators.js";
import { form, validate } from "../components/validators.js";
import { encrypt } from "../modules/cryptography.js";
import { CSV } from "../components/providers.js";
import { Connector, Schema } from "../typings/common.js";

export const getHeaders: { [provider: string]: (connector: Connector) => Promise<string[]> } = {
    csv: async function(connector: Connector){
        const csv = new CSV(connector.path as string);
        const data = await csv.open() as { data: {[k: string]: string}[], meta: { fields: string[] } };
        return data.meta.fields || [];
    },
    ldap: async function(connector: Connector){
        return [
            ...connector.attributes||[],
            'sAMAccountName', 'userPrincipalName', 'cn', 'distinguishedName'
        ].filter((b, index, self) => index === self.findIndex((a) => ( a === b )) );
    },
    stmc: async function(connector: Connector){
        const headers = ['_class', '_cn', '_desc', '_disabled', '_displayName', '_dn', '_firstName',
        '_google', '_intune', '_lastLogon', '_lastName', '_lastPwdResetViaMC', '_lockedOut',
        '_login', '_o365', '_pwdExpired', '_pwdExpires', '_pwdLastSet',
        '_pwdNeverExpires', '_pwdResetAction', '_pwdResetTech', '_yammer' ];
        if (String(connector.eduhub).trim()!=="") headers.push('_eduhub');
        return headers;
    },
}

export default function connector(route: FastifyInstance) {
    route.post('/', form({
        name: validConnectorName(),
    }), async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            const body = request.body as anyProvider;
            if (schema._connectors[body.name]) throw reply.code(409).send({ validation: { name: "Connector name taken." } });
            if (!validators[body.id]) throw Error("Unknown provider.");
            const filePath = `${path}/schemas/${schema.name}/connectors.yaml`;
            if (body.password) {
                const hash = await encrypt(body.password);
                body.password = hash;
            }
            const invalid = await validate(body, validators[body.id], reply, request );
            if (invalid) return;
            schema._connectors[body.name] = body;
            schema.connectors.push(body);
            writeYAML(schema.connectors, filePath);
            if (body.id in getHeaders) schema.headers[body.name] = await getHeaders[body.id](body);
            return {connectors: schema.connectors, _connectors: schema._connectors, headers: schema.headers };
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
    function hasHandle(haystack: string = "", needle: string){ return haystack.includes(`${needle}.`) || haystack.includes(`${needle}/`); }
    function findDependencies(schema: Schema, name: string){ //TODO - find deps in other connectors
        for (const rule of schema.rules) {
            if (hasHandle(rule.display, name)) return rule.name;
            for (const condition of rule.conditions||[]) {
                if (hasHandle(condition.key, name)) return rule.name;
                if (hasHandle(condition.value, name)) return rule.name;
            }
            for (const action of rule.actions||[]) {
                if (hasHandle(action.value, name)) return rule.name;
                if (hasHandle(action.source, name)) return rule.name;
                if (hasHandle(action.target, name)) return rule.name;
                if (hasHandle(action.upn, name)) return rule.name;
                if (hasHandle(action.ou, name)) return rule.name;
                for (const attribute of action.attributes||[]) if (hasHandle(attribute.value, name)) return rule.name;
                for (const group of action.groups||[]) if (hasHandle(group, name)) return rule.name;
                for (const template of action.templates||[]) {
                    if (hasHandle(template.name, name)) return rule.name;
                    if (hasHandle(template.value, name)) return rule.name;
                }
            }
        } return false;
    }
    route.put('/:connector_name', form({
        name: validConnectorName(),
    }), async (request, reply) => {
        const { schema_name, connector_name } = request.params as { schema_name: string, connector_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            const body = request.body as anyProvider;
            if (!validators[body.id]) throw Error("Unknown provider.");
            if (body.password && typeof body.password === "string") {
                const hash = await encrypt(body.password);
                body.password = hash;
            }
            const invalid = await validate(body, validators[body.id], reply, request );
            if (invalid) return;
            if (connector_name!==body.name){
                if (schema._connectors[body.name]) throw reply.code(409).send({ validation: { name: "Connector name taken." } });
                const dependencies = findDependencies(schema, connector_name);
                if (dependencies) throw reply.code(400).send({ validation: { name: `Found references to name '${connector_name}' in rule '${dependencies}'.` } });
                delete schema._connectors[connector_name];
                delete schema.headers[connector_name];
                schema._connectors[body.name] = body;
                schema.connectors = schema.connectors.filter(c=>c.name!==connector_name);
                schema.connectors.push(body);
            } else {
                schema._connectors[connector_name] = body;
                schema.connectors = schema.connectors.map(c=>c.name!==connector_name?c:body);
            }
            const filePath = `${path}/schemas/${schema.name}/connectors.yaml`;
            writeYAML(schema.connectors, filePath);
            if (body.id in getHeaders) schema.headers[body.name] = await getHeaders[body.id](body);
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
            const filePath = `${path}/schemas/${schema.name}/connectors.yaml`;
            writeYAML(schema.connectors, filePath);
            if (copy.id in getHeaders) schema.headers[newName] = await getHeaders[copy.id](copy);
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
            if (!validators[connector.id]) throw Error("Unknown provider.");
            request.body = { username: connector.username, password: connector.password };
            await validate(connector, validators[connector.id], reply, request );
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
            const dependencies = findDependencies(schema, connector_name);
            if (dependencies) throw reply.code(400).send({ validation: { name: `Found references to name '${connector_name}' in rule '${dependencies}'.` } });
            const filePath = `${path}/schemas/${schema.name}/connectors.yaml`;
            delete schema._connectors[connector_name];
            schema.connectors = schema.connectors.filter(c=>c.name!==connector_name);
            writeYAML(schema.connectors, filePath);
            delete schema.headers[connector_name];
            return {connectors: schema.connectors, _connectors: schema._connectors, headers: schema.headers};
        } catch (e) {
          const error = _Error(e);
          reply.code(500).send({ error: error.message });
        }
    });
}