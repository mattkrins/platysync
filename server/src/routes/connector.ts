import { FastifyInstance } from "fastify";
import { _Error } from "../server.js";
import { getSchema } from './schema.js'
import { anyProvider } from "../typings/providers.js";
import { path } from "../server.js";
import { writeYAML } from "../storage.js";
import { validators } from "../components/validators.js";
import { form, isNotEmpty, validate } from "../components/validators.js";
import { encrypt } from "../modules/cryptography.js";
import { CSV } from "../components/providers.js";
import { Connector } from "../typings/common.js";

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
  stmc: async function(){
      return ['_class', '_cn', '_desc', '_disabled', '_displayName', '_dn', '_firstName',
      '_google', '_intune', '_lastLogon', '_lastName', '_lastPwdResetViaMC', '_lockedOut',
      '_login', '_o365', '_pwdExpired', '_pwdExpires', '_pwdLastSet',
      '_pwdNeverExpires', '_pwdResetAction', '_pwdResetTech', '_yammer']
  },
}

export default function connector(route: FastifyInstance) {
    route.post('/', form({
        name: isNotEmpty('Name can not be empty.'),
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
            await validate(body, validators[body.id], reply, request );
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
    route.put('/:connector_name', form({
        name: isNotEmpty('Name can not be empty.'),
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
            await validate(body, validators[body.id], reply, request );
            if (connector_name!==body.name){ //TODO - find refrences to old name and replace
                if (schema._connectors[body.name]) throw reply.code(409).send({ validation: { name: "Connector name taken." } });
                delete schema._connectors[connector_name];
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
    route.delete('/:connector_name', async (request, reply) => {
        const { schema_name, connector_name } = request.params as { schema_name: string, connector_name: string };
        try {
            const schema = getSchema(schema_name, reply);
            if (!schema._connectors[connector_name]) throw reply.code(404).send({ validation: { name: "Connector does not exist." } });
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