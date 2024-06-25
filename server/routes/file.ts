import { FastifyInstance } from "fastify";
import { isAlphanumeric, isNotEmpty, validate, xError } from "../modules/common";
import { getFiles, getSchema, sync } from "../components/database";
import multer from 'fastify-multer';
import { paths } from "../../server";
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime';

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try { return await getFiles(schema_name); }
        catch (e) { new xError(e).send(reply); }
    });
    route.get('/:name', async (request, reply) => {
        const { schema_name, name } = request.params as { schema_name: string, name: string };
        try {
            const schema = await getSchema(schema_name);
            const file = schema.files.find(f=>f.name===name);
            if (!file) throw new xError("File not found.", "name", 404 );
            const folder = `${paths.storage}/${schema_name}`;
            const path = `${folder}/${file.path}`;
            if (!fs.existsSync(path)) throw new xError("File not found on system.", undefined, 404 );
            const mime_type = mime.getType(path)
            const bufferIndexHtml = fs.readFileSync(path);
            reply.type(mime_type||'text/txt').send(bufferIndexHtml);
        }
        catch (e) { new xError(e).send(reply); }
    });
    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });
    route.register(multer.contentParser);
    route.post('/', { preValidation: upload.single('file') }, async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { file: data } = (request as unknown as { file: { buffer: Buffer, originalname: string }, name: string, key: string });
        let { name, key } = request.body as { name: string, key: string };
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            if (key){ validate( { key }, {
                key: isAlphanumeric('Key can only contain alphanumeric characters.'),
            }); } else {
                validate( { name }, {
                    name: isAlphanumeric('No key provided. Name can only contain alphanumeric characters.'),
                }); key = name;
            }
            if (!data) throw new xError("No file selected", 'path', 404);
            const files = await getFiles(schema_name);
            const file = files.find(f=>f.name===name);
            if (file) throw new xError("File name taken", 'name', 409);
            const file_key = files.find(f=>f.key===key);
            if (file_key) throw new xError("Key already in use.", 'key', 409);
            const folder = `${paths.storage}/${schema_name}`;
            if (!fs.existsSync(folder)) fs.mkdirSync(folder);
            const file_name = data.originalname.split(".");
            const format = file_name[1];
            const id = uuidv4();
            const path = `${file_name[0]}.${id}.${format}`;
            fs.writeFileSync(`${folder}/${path}`, data.buffer);
            files.push({ name, path, key, format, });
            await sync();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', { preValidation: upload.single('file') }, async (request, reply) => {
        return true
    });
    route.delete('/', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { name } = request.body as { name: string };
        try {
            const schema = await getSchema(schema_name);
            const file = schema.files.find(f=>f.name===name);
            if (!file) throw new xError("File not found.", "name", 404 );
            const folder = `${paths.storage}/${schema_name}`;
            const path = `${folder}/${file.path}`;
            try { if (fs.existsSync(path)) fs.rmSync(path); } catch (e) {
                throw new xError("Failed to delete on filesystem.", null, 500 );
            }
            schema.files = schema.files.filter(f=>f.name!==name);
            await sync();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}