import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { path, version } from '../server.js';
import * as fs from 'fs';
import { _Error } from "../server.js";
import { deleteFolderRecursive, readYAML, writeYAML } from "../storage.js";
import { Schema } from '../typings/common.js'
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
  const schemasPath = `${path}/schemas`;
  const filePath = `${schemasPath}/${name}/schema.yaml`;
  const yaml: Schema = readYAML(filePath);
  const connectors: Schema['connectors'] = readYAML(`${schemasPath}/${name}/connectors.yaml`) || [];
  const _connectors: Schema['_connectors'] = connectors.reduce((acc: Schema['_connectors'],c)=> (acc[c.name]=c,acc),{});
  const rules: Schema['rules'] = readYAML(`${schemasPath}/${name}/rules.yaml`) || [];
  const _rules: Schema['_rules'] = rules.reduce((acc: Schema['_rules'],r)=> (acc[r.name]=r,acc),{});
  let headers: { [connector: string]: string[]; } = {};
  const errors: string[] = []; //REVIEW - Janky way of handling errors. Should think of a better way.
  try {
    headers = await buildHeaders(connectors);
  } catch (e) {
    errors.push(_Error(e).message);
  }
  const schema = {
    ...yaml,
    connectors,
    _connectors,
    rules,
    _rules,
    headers,
    errors,
  }
  if (_schemas[yaml.name]) { // already cached
    schemas = schemas.map(s=>s.name!==name?s:schema);
  } else {
    schemas.push(schema);
  }
  _schemas[yaml.name] = schema;
  return schema;
}
export function mutateSchemaCache(mutated: Schema) {
  schemas = schemas.map(s=>s.name!==mutated.name?s:mutated);
  _schemas[mutated.name] = mutated;
}
export async function initSchemaCache() {
  schemas = [];
  _schemas = {};
  const schemasPath = `${path}/schemas`;
  const files = fs.readdirSync(schemasPath);
  for (const name of files){
    const schema = await cacheSchema(name);
    await versioner(schema);
  }
}

export function getSchema(name: string, reply?: FastifyReply) {
  if ((name in _schemas)) return _schemas[name];
  if (reply) throw reply.code(404).send({ error: "Schema not found." });
  throw Error("Schema not found.")
}


export default function schema(route: FastifyInstance) {
  initSchemaCache();
  const schemasPath = `${path}/schemas`;
  function createSchema(name: string){
    const folderPath = `${schemasPath}/${name}`;
    fs.mkdirSync(folderPath);
    const schema: Schema = { name, version, connectors: [], _connectors: {}, rules: [], _rules: {}, headers: {}, errors: [] };
    writeYAML(schema, `${folderPath}/schema.yaml`);
    writeYAML('', `${folderPath}/rules.yaml`);
    writeYAML('', `${folderPath}/connectors.yaml`);
    _schemas[name] = schema;
    schemas.push(schema);
    return schema;
  }
  route.get('/', async () => schemas);
  route.post('/', form({
    name: validWindowsFilename('Invalid schema name.'),
  }), async (request, reply) => {
    try {
      const { name } = request.body as { name: string };
      if (name in _schemas) throw reply.code(409).send({ validation: { name: "Schema name taken." } });
      return createSchema(name);
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });
  route.get('/:name/export/:bearer', async (request, reply) => {
    const { name } = request.params as { name: string };
    try {
      getSchema(name, reply);
      const folderPath = `${path}/schemas/${name}`;
      if (!fs.existsSync(folderPath)) throw reply.code(404).send({ error: "Folder not found." });
      const zipFileName = `${name}-export.zip`;
      const zip = new AdmZip();
      zip.addLocalFolder(folderPath);
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
    const folderPath = `${path}/schemas/${name}`;
    zip.extractAllTo(folderPath, true);
    const mutated = {...oldSchema, ...yaml, name }
    writeYAML(mutated, `${folderPath}/schema.yaml`);
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
    createSchema(name);
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
        deleteFolderRecursive(`${path}/schemas/${name}`);
        delete _schemas[name];
        schemas = schemas.filter(s=>s.name!==name);
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
      const { name: newName, connectors, rules, ...mutations } = request.body as Schema;
      try {
        const schema = getSchema(name, reply);
        let writePath = `${path}/schemas/${name}`;
        const mutated = { ...schema, ...mutations, name: newName };
        if ( name!==newName ){
          if (newName in _schemas) throw reply.code(409).send({ validation: { name: "Schema name taken." } });
          const newPath = `${path}/schemas/${newName}`;
          fs.renameSync(writePath, newPath);
          writePath = `${path}/schemas/${newName}`
          delete _schemas[name];
          _schemas[newName] = mutated;
          schemas = schemas.filter(s=>s.name!==name);
          schemas.push(mutated);
        } else {
          _schemas[name] = mutated;
          schemas = schemas.map(s=>s.name!==name?s:mutated);
        }
        const filePath = `${writePath}/schema.yaml`;
        writeYAML(mutated, filePath);
        return true;
      } catch (e) {
        const error = _Error(e);
        reply.code(500).send({ error: error.message });
      }
  });
}