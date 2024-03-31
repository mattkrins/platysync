import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Schemas, Schema } from "../components/models.js";
//import { log, path, version } from '../server.js';
//import * as fs from 'fs';
//import { _Error } from "../server.js";
//import { Schema, SchemaYaml } from '../typings/common.js'
//import { form, validWindowsFilename } from "../components/validators.js";
import { xError } from "../modules/common.js";
//import AdmZip from 'adm-zip';
//import multer from 'fastify-multer';
//import YAML, { stringify } from 'yaml'
//import { providers } from "../components/providers.js";

export const _schemas = {}
export const schemas = []
export const getSchema: (a?:any,b?:any) => any = () => {}
export const mutateSchema: (a?:any) => any = () => {}
export const initSchemaCache: (a?:any) => any = () => {}

const schemas2 = new Schemas();

export default async function schema(route: FastifyInstance) {
  await schemas2.load();
  // Get all schemas
  route.get('/', async () => schemas2.getAll(true) );
  // Create new schema
  route.post('/', async (request, reply) => {
    try { return schemas2.create(request.body as Schema).parse(); }
    catch (e) { new xError(e).sendValidation(reply); }
  });
  // Get Schema
  route.get('/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      try { return schemas2.get(name, true); }
      catch (e) { new xError(e).send(reply); }
  });
  //route.get('/:name/export/:bearer', async (request, reply) => {
  //  const { name } = request.params as { name: string };
  //});
  //const storage = multer.memoryStorage();
  //const upload = multer({ storage: storage });
  //route.register(multer.contentParser);
  //route.post('/import', {
  //  preValidation: upload.single('file'), 
  //...form({
  //  name: validWindowsFilename('Invalid schema name.'),
  //}) } , async (request, reply) => {
  //  const { name } = request.body as { name: string };
  //})
  //route.post('/:name/import', { preValidation: upload.single('file') } , async (request, reply) => {
  //  const { name } = request.params as { name: string };
  //});
  //route.get('/:name', async (request, reply) => {
  //    const { name } = request.params as { name: string };
  //});
  //route.delete('/:name', async (request, reply) => {
  //    const { name } = request.params as { name: string };
  //});
  //route.put('/:name', form({
  //  name: validWindowsFilename('Invalid schema name.'),
  //}), async (request, reply) => {
  //    const { name } = request.params as { name: string };
  //    const { name: newName, ...mutations } = request.body as Schema;
  //});
}
