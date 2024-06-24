import { FastifyInstance } from "fastify";
import { isAlphanumeric, isNotEmpty, validate, xError } from "../modules/common";
import database, { getFiles } from "../components/database";
import multer from 'fastify-multer';
import { paths } from "../../server";
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try { return await getFiles(schema_name); }
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
            const folder = `${paths.storage}/${schema_name}`;
            if (!fs.existsSync(folder)) fs.mkdirSync(folder);
            const file_name = data.originalname.split(".");
            const format = file_name[1];
            const id = uuidv4();
            const path = `${file_name[0]}.${id}.${format}`;
            fs.writeFileSync(`${folder}/${path}`, data.buffer);
            files.push({ name, path, key, format, });
            const db = await database();
            await db.write();
            return true;
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', { preValidation: upload.single('file') }, async (request, reply) => {
        return true
    });
}