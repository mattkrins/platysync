import { FastifyInstance } from "fastify";
import { _Error, paths } from "../server.js";
import { Doc } from "../db/models.js";
import multer from 'fastify-multer';
import * as fs from 'fs';
import { template } from "../typings/common.js";
import { findDependencies } from "../modules/common.js";
import { getSchema } from "./schema.js";

export async function docsToTemplate(schema_name: string) : Promise<template> {
  const docsTemplate: template = { $file: {} };
  const docs = await Doc.findAll({where: { schema: schema_name }, raw: true });
  for (const doc of docs) {
      const path = `${paths.storage}/${schema_name}/${doc.id}${doc.ext?`.${doc.ext}`:''}`;
      (docsTemplate.$file as { [k: string]: string })[doc.name] = path;
  } return docsTemplate;
}

export default async function (route: FastifyInstance) {
  const clean = /[^\w\s]/g;
  route.get('/', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    try {
      return await Doc.findAll({where: { schema: schema_name }});
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });
  route.delete('/', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const { id } = request.body as { id: string };
    try {
      const doc = await Doc.findOne({where: { id, schema: schema_name }});
      if (!doc) throw reply.code(404).send({ validation: { name: "Doc not found." } });
      const schema = getSchema(schema_name, reply);
      const dependencies = findDependencies(schema, doc.name, true, true);
      if (dependencies) throw reply.code(400).send({ error: `Found references to file '${doc.name}' in '${dependencies}'.` });
      const path = `${paths.storage}/${schema_name}/${doc.id}${doc.ext?`.${doc.ext}`:''}`;
      if (fs.existsSync(path)) fs.rmSync(path);
      await doc.destroy();
      return await Doc.findAll({where: { schema: schema_name }});
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });
  route.put('/', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const change = request.body as Doc;
    try {
      if (clean.test(change.name)) throw reply.code(406).send({ error: "Invalid name.", validation: { id: change.id } });
      const doc = await Doc.findOne({where: { id: change.id, schema: schema_name }});
      if (!doc) throw reply.code(404).send({ error: "Doc not found.", validation: { id: change.id } });
      const existing = await Doc.findOne({where: { name: change.name, schema: schema_name }});
      if (existing) throw reply.code(406).send({ error: "Name taken.", validation: { id: change.id } });
      doc.name = change.name;
      doc.save();
      return await Doc.findAll({where: { schema: schema_name }});
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });
  route.put('/reorder', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const { from, to } = request.body as { from: number, to: number };
    try {
      const f1 = await Doc.findOne({where: { index: from, schema: schema_name }});
      if (!f1) throw reply.code(404).send({ validation: { name: "Doc index mismatch." } });
      const f2 = await Doc.findOne({where: { index: to, schema: schema_name }});
      if (!f2) throw reply.code(404).send({ validation: { name: "Doc index mismatch." } });
      f1.index = to;
      f2.index = from;
      await f1.save();
      await f2.save();
      return await Doc.findAll({where: { schema: schema_name }});
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });
  route.register(multer.contentParser);
  route.post('/', { preValidation: upload.single('file') }, async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    try {
      const { file } = (request as unknown as { file: { buffer: Buffer, originalname: string } });
      const folder = `${paths.storage}/${schema_name}`;
      if (!fs.existsSync(folder)) fs.mkdirSync(folder);
      const i = await Doc.count({where: { schema: schema_name }});
      const ext = file.originalname.split(".")[1];
      const doc = await Doc.create({ name: file.originalname.replace(clean, '_')+`${i}`, schema: schema_name, ext });
      fs.writeFileSync(`${folder}/${doc.id}${ext?`.${ext.slice(0, 4)}`:''}`, file.buffer);
      return await Doc.findAll({where: { schema: schema_name }});
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });
}