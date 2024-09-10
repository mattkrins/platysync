import { FastifyInstance } from "fastify";
import { isAlphanumeric, isNotEmpty, validate, xError } from "../modules/common";
import { getFiles, getSchema, sync } from "../components/database";
import multer from 'fastify-multer';
import { log, paths } from "../..";
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime/lite';

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try { return await getFiles(schema_name); }
        catch (e) { new xError(e).send(reply); }
    });
    route.post('s/reorder', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { to, from } = request.body as { to: number, from: number };
        try {
            const array = await getFiles(schema_name);
            const to_value = array[to];
            const from_value = array[from];
            array[from] = to_value;
            array[to] = from_value;
            await sync();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.get('/:name', async (request, reply) => {
        const { schema_name, name } = request.params as { schema_name: string, name: string };
        try {
            const schema = await getSchema(schema_name);
            const file = schema.files.find(f=>f.name===name);
            if (!file) throw new xError("File not found.", null, 404 );
            const folder = `${paths.storage}/${schema_name}`;
            const path = `${folder}/${file.path}`;
            if (!fs.existsSync(path)) throw new xError("File not found on system.", null, 404 );
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
        const { file: data } = (request as unknown as { file?: { buffer: Buffer, originalname: string }, name: string, key: string });
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
                });
            }
            if (!data) throw new xError("No file selected", 'path', 404);
            if (!data.originalname.includes(".")) throw new xError("File extention not found.", 'path');
            const files = await getFiles(schema_name);
            const file = files.find(f=>f.name===name);
            if (file) throw new xError("File name taken", 'name', 409);
            const file_key = files.find(f=>f.key===key);
            if (key && file_key) throw new xError("Key already in use.", 'key', 409);
            const folder = `${paths.storage}/${schema_name}`;
            if (!fs.existsSync(folder)) fs.mkdirSync(folder);
            const file_name = data.originalname.split(".");
            const format = file_name.pop();
            const id = uuidv4();
            const path = `${file_name[0]}.${id}.${format}`;
            if (fs.existsSync(`${folder}/${path}`)) throw new xError("File exists.", 'path', 409);
            fs.writeFileSync(`${folder}/${path}`, data.buffer);
            files.push({ name, path, key, format, });
            await sync();
            log.silly({message: "File created", file: name, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', { preValidation: upload.single('file') }, async (request, reply) => {
        const { schema_name, editing } = request.params as { schema_name: string, editing: string };
        const { file: data } = (request as unknown as { file?: { buffer: Buffer, originalname: string }, name: string, key: string });
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
                });
            }
            const schema = await getSchema(schema_name);
            const file = schema.files.find(f=>f.name===editing);
            if (!file) throw new xError("File not found.", "name", 404 );
            if (editing!==name){
                if (schema.files.find(s=>s.name===name)) throw new xError("File name taken.", "name", 409);
            }
            file.name = name;
            file.key = key;
            if (data) {
                const file_name = data.originalname.split(".");
                const format = file_name.pop();
                const id = uuidv4();
                const folder = `${paths.storage}/${schema_name}`;
                const old_path = `${folder}/${file.path}`;
                const path = `${file_name[0]}.${id}.${format}`;
                if (fs.existsSync(`${folder}/${path}`)) throw new xError("File exists.", 'path', 409);
                try { if (fs.existsSync(old_path)) fs.rmSync(old_path); } catch (e) { throw new xError("Failed to remove old file.", null, 500 ); }
                fs.writeFileSync(`${folder}/${path}`, data.buffer);
                file.format = format;
                file.path = path;
            }
            await sync();
            log.silly({message: "File modified", file: name, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
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
            log.silly({message: "File deleted", file: name, schema: schema_name });
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
}