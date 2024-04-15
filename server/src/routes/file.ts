import { FastifyInstance } from "fastify";
import { paths } from "../server.js";
import { Doc } from "../db/models.js";
import multer from 'fastify-multer';
import * as fs from 'fs';
import { xError } from "../modules/common.js";
import mime from 'mime';

export default async function (route: FastifyInstance) {
  const clean = /[^\w\s]/g;
  // Get all Files
  route.get('/', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    try { return await Doc.findAll({where: { schema: schema_name }}); }
    catch (e) { new xError(e).send(reply); }
  });
  // Download File
  route.get('/:id/:bearer', async (request, reply) => {
    const { schema_name, id } = request.params as { schema_name: string, id: string };
    try {
      const doc = await Doc.findOne({where: { id, schema: schema_name }});
      if (!doc) throw new xError("Doc not found.", id, 404 );
      const path = `${paths.storage}/${schema_name}/${doc.id}${doc.ext?`.${doc.ext}`:''}`;
      if (!fs.existsSync(path)) throw new xError("Doc not found on system.", id, 404 );
      const mime_type = mime.getType(path)
      const bufferIndexHtml = fs.readFileSync(path);
      reply.type(mime_type||'text/txt').send(bufferIndexHtml);
    }
    catch (e) { new xError(e).send(reply); }
  });
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });
  route.register(multer.contentParser);
  // Create File
  route.post('/', { preValidation: upload.single('file') }, async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const { file } = (request as unknown as { file: { buffer: Buffer, originalname: string } });
    try {
      const folder = `${paths.storage}/${schema_name}`;
      if (!fs.existsSync(folder)) fs.mkdirSync(folder);
      const i = await Doc.count({where: { schema: schema_name }});
      const ext = file.originalname.split(".")[1];
      const doc = await Doc.create({ name: file.originalname.replace(clean, '_')+`${i}`, schema: schema_name, ext });
      fs.writeFileSync(`${folder}/${doc.id}${ext?`.${ext.slice(0, 4)}`:''}`, file.buffer);
      return await Doc.findAll({where: { schema: schema_name }});
    }
    catch (e) { new xError(e).send(reply); }
  });
  // Delete File
  route.delete('/', async (request, reply) => {
    const { schema_name } = request.params as { schema_name: string };
    const { id } = request.body as { id: string };
    try {
      const doc = await Doc.findOne({where: { id, schema: schema_name }});
      if (!doc) throw new xError("Doc not found.", id, 404 );
      const path = `${paths.storage}/${schema_name}/${doc.id}${doc.ext?`.${doc.ext}`:''}`;
      if (fs.existsSync(path)) fs.rmSync(path);
      await doc.destroy();
      return await Doc.findAll({where: { schema: schema_name }});
    }
    catch (e) { new xError(e, id).send(reply); }
  });
  // Change File
  route.put('/', async (request, reply) => {
    const { schema_name: schema } = request.params as { schema_name: string };
    const change = request.body as Doc;
    try {
      if (clean.test(change.name)) throw new xError("Invalid name.", 'name', 406 );
      const doc = await Doc.findOne({where: { id: change.id, schema }});
      if (!doc) throw new xError("Doc not found.", undefined, 404 );
      const existing = await Doc.findOne({where: { name: change.name, schema }});
      if (existing) throw new xError("Name taken.", 'name', 406 );
      doc.set(change);
      await doc.save();
      return await Doc.findAll({where: { schema }});
    } catch (e) { new xError(e).send(reply); }
  });
  // Reorder File
  route.put('/reorder', async (request, reply) => {
    const { schema_name: schema } = request.params as { schema_name: string };
    const { from, to } = request.body as { from: number, to: number };
    try {
      const f1 = await Doc.findOne({where: { index: from, schema }});
      if (!f1) throw new xError("Doc index mismatch.", undefined, 404 );
      const f2 = await Doc.findOne({where: { index: to, schema }});
      if (!f2) throw new xError("Doc index mismatch.", undefined, 404 );
      f1.index = to;
      f2.index = from;
      await f1.save();
      await f2.save();
      return await Doc.findAll({where: { schema }});
    } catch (e) { new xError(e).send(reply); }
  });
}