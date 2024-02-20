import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { log, path, version } from '../server.js';
import * as fs from 'fs';
import { _Error } from "../server.js";
import { readYAML, writeYAML } from "../storage.js";
import { Schema, SchemaYaml } from '../typings/common.js'
import { form, validWindowsFilename } from "../components/validators.js";
import AdmZip from 'adm-zip';
import multer from 'fastify-multer';
import YAML from 'yaml'
import { getHeaders } from "./connector.js";
import versioner from "../components/versioner.js";

export let schemas: Schema[] = [];
export let _schemas: { [name: string]: Schema } = {};
async function buildHeaders(connectors: Schema['connectors']) {
  const headers: { [connector: string]: string[] } = {};
  for (const connector of connectors) {
    if (!getHeaders[connector.id]) continue;
    headers[connector.name] = await getHeaders[connector.id](connector);
  } return headers;
}

export async function cacheSchema(name: string) {
  const yaml: Schema = readYAML(`${path}/schemas/${name}.yaml`);
  const _connectors: Schema['_connectors'] = yaml.connectors.reduce((acc: Schema['_connectors'],c)=> (acc[c.name]=c,acc),{});
  const _rules: Schema['_rules'] = yaml.rules.reduce((acc: Schema['_rules'],r)=> (acc[r.name]=r,acc),{});
  let headers: { [connector: string]: string[]; } = {};
  const errors: string[] = []; //REVIEW - Janky way of handling errors. Should think of a better way.
  try {
    headers = await buildHeaders(yaml.connectors);
  } catch (e) {
    errors.push(_Error(e).message);
  }
  const schema = { ...yaml, _connectors, _rules, headers, errors };
  if (_schemas[yaml.name]) { // already cached
    schemas = schemas.map(s=>s.name!==name?s:schema);
  } else {
    schemas.push(schema);
  }
  _schemas[yaml.name] = schema;
  return schema;
}

export async function initSchemaCache() {
  schemas = [];
  _schemas = {};
  versioner();
  const folderPath = `${path}/schemas/`;
  const all = fs.readdirSync(folderPath);
  const files = all.filter(o => fs.statSync(`${folderPath}/${o}`).isFile() );
  for (const file of files){
    const name = file.split(".")[0];
    await cacheSchema(name);
  }
}

export function getSchema(name: string, reply?: FastifyReply) {
  if ((name in _schemas)) return _schemas[name];
  if (reply) throw reply.code(404).send({ error: "Schema not found." });
  throw Error("Schema not found.")
}

export function removeSchema(name: string, save = true) {
  delete _schemas[name];
  schemas = schemas.filter(s=>s.name!==name);
  if (!save) return;
  fs.unlinkSync(`${path}/schemas/${name}.yaml`);
}

function cleanSchema(schema: Schema|object): SchemaYaml {
  const clean = {...schema} as SchemaYaml;
  delete clean._connectors;
  delete clean._rules;
  delete clean.headers;
  delete clean.errors;
  return clean;
}

export function mutateSchema(mutated: Schema, save = true, init = true) {
  const oldSchema = init ? {} : getSchema(mutated.name);
  const schema = {...oldSchema, ...mutated};
  schemas = schemas.map(s=>s.name!==schema.name?s:schema);
  _schemas[schema.name] = schema;
  if (!save) return;
  const schemaPath = `${path}/schemas/${schema.name}.yaml`;
  writeYAML(cleanSchema(schema), schemaPath);
}

export default function schema(route: FastifyInstance) {
  initSchemaCache();
  async function createSchema(name: string, schema?: object){
    const init = schema ? cleanSchema(schema) : {};
    writeYAML({ name, version, connectors: [], rules: [], ...init }, `${path}/schemas/${name}.yaml`);
    return await cacheSchema(name);
  }
  route.get('/', async () => schemas);
  route.post('/', form({
    name: validWindowsFilename('Invalid schema name.'),
  }), async (request, reply) => {
    try {
      const { name } = request.body as { name: string };
      if (name in _schemas) throw reply.code(409).send({ validation: { name: "Schema name taken." } });
      return await createSchema(name);
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });
  route.get('/:name/export/:bearer', async (request, reply) => {
    const { name } = request.params as { name: string };
    try {
      getSchema(name, reply);
      const zipFileName = `${name}-export.zip`;
      const zip = new AdmZip();
      zip.addLocalFile(`${path}/schemas/${name}.yaml`, '', 'schema.yaml');
      const zipBuffer = zip.toBuffer();
      reply.header('Content-Disposition', `attachment; filename=${zipFileName}`);
      reply.type('application/zip');
      reply.send(zipBuffer);
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });
  async function importSchema(oldSchema: Schema, request: FastifyRequest) {
    const name = oldSchema.name;
    const { buffer } = (request as unknown as { file: { buffer: Buffer } }).file;
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const schemaFile = zipEntries.filter(e=>e.entryName==="schema.yaml")
    if (schemaFile.length<=0) throw Error("Invalid schema structure.");
    const contents = schemaFile[0].getData().toString("utf8");
    const yaml = YAML.parse(contents);
    const mutated = {...oldSchema, ...yaml, name };
    writeYAML(mutated, `${path}/schemas/${name}.yaml`);
    versioner();
    return await cacheSchema(name);
  }
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });
  route.register(multer.contentParser);
  route.post('/import', {
    preValidation: upload.single('file'), 
  ...form({
    name: validWindowsFilename('Invalid schema name.'),
  }) } , async (request, reply) => {
    const { name } = request.body as { name: string };
    if (name in _schemas) throw reply.code(409).send({ validation: { name: "Schema name taken." } });
    await createSchema(name);
    const schema = getSchema(name, reply);
    return await importSchema(schema, request);
  })
  route.post('/:name/import', { preValidation: upload.single('file') } , async (request, reply) => {
    const { name } = request.params as { name: string };
    try {
      const schema = getSchema(name, reply);
      await importSchema(schema, request);
      return true;
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });
  route.get('/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      try {
        let schema = getSchema(name, reply);
        if (schema.errors.length>0) schema = await cacheSchema(name); // Update cache in case error was fixed.
        return schema;
      } catch (e) {
        const error = _Error(e);
        reply.code(500).send({ error: error.message });
      }
  });
  route.delete('/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      try {
        getSchema(name, reply);
        removeSchema(name);
        return true;
      } catch (e) {
        const error = _Error(e);
        reply.code(500).send({ error: error.message });
      }
  });
  route.put('/:name', form({
    name: validWindowsFilename('Invalid schema name.'),
  }), async (request, reply) => {
      const { name } = request.params as { name: string };
      const { name: newName, ...mutations } = request.body as Schema;
      try {
        const schema = getSchema(name, reply);
        if ( name!==newName ){
          if (newName in _schemas) throw reply.code(409).send({ validation: { name: "Schema name taken." } });
          const filePath = `${path}/schemas/${name}.yaml`;
          if (!fs.existsSync(filePath)) log.error(`${name} was renamed but ${filePath} did not exist.`);
          removeSchema(name);
          createSchema(newName, mutations);
        } else {
          mutateSchema({...schema, ...mutations});
        }
        return true;
      } catch (e) {
        const error = _Error(e);
        reply.code(500).send({ error: error.message });
      }
  });
}