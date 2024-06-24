import { FastifyInstance } from "fastify";
import { xError } from "../modules/common";
import { getFiles } from "../components/database";
import multer from 'fastify-multer';
import { paths } from "../../server";
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        try {
            const files = await getFiles(schema_name);
            return files;
        }
        catch (e) { new xError(e).send(reply); }
    });
    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });
    route.register(multer.contentParser);
    route.post('/', { preValidation: upload.single('file') }, async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const { file: data, name, key } = (request as unknown as { file: { buffer: Buffer, originalname: string }, name: string, key: string });
        try {
            const files = await getFiles(schema_name);
            const folder = `${paths.storage}/${schema_name}`;
            if (!fs.existsSync(folder)) fs.mkdirSync(folder);
            const file_name = data.originalname.split(".");
            const ext = file_name[1];
            const id = uuidv4();
            const path = `${file_name[0]}.${id}.${ext}`;
            fs.writeFileSync(`${folder}/${path}`, data.buffer);
            files.push({
                name,
                path,
                key,
                format: ext,
            });
        }
        catch (e) { new xError(e).send(reply); }
    });
}