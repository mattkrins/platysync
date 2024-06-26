import { FastifyInstance } from "fastify";
import { hasLength, isNotEmpty, validate, xError } from "../modules/common";
import database, { Schemas } from "../components/database";
import { version } from "../../server";

interface newSchema extends Schema {
    importing?: boolean;
    editing?: string;
}

const defaultSchema: Schema = {
    name: '',
    version: '',
    connectors: [],
    rules: [],
    files: [],
}

export default async function (route: FastifyInstance) {
    route.get('s', async (request, reply) => {
        try {
            return await Schemas();
        } catch (e) { new xError(e).send(reply); }
    });
    route.post('/', async (request, reply) => {
        const { name, importing, ...schema } = request.body as newSchema;
        try {
            validate( { name }, {
                name: hasLength({ min: 2 }, 'Name must be greater than 2 characters.'),
            });
            if (importing) {
                if (!schema.version) throw new xError("Malformed structure.");
            }
            const db = await database();
            const { data: { schemas } } = db;
            if (schemas.find(s=>s.name===name)) throw new xError("Schema name taken.", "name", 409);
            schemas.push({ ...defaultSchema, name, ...schema, version });
            await db.write();
            return name;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/', async (request, reply) => {
        let { name, editing, importing, ...schema } = request.body as newSchema;
        try {
            validate( { name, editing }, {
                name: hasLength({ min: 2 }, 'Name must be greater than 2 characters.'),
                editing: isNotEmpty('Username Param can not be empty.'),
            });
            if (importing) {
                if (!schema.version) throw new xError("Malformed structure.");
                name = editing as string;
            }
            const db = await database();
            const { data: { schemas } } = db;
            const old_schema = schemas.find(s=>s.name===editing);
            if (!old_schema) throw new xError("Schema not found.", "name", 404);
            if (editing!==name){
                if (schemas.find(s=>s.name===name)) throw new xError("Schema name taken.", "name", 409);
            }
            db.data.schemas = schemas.map(s=>s.name!==editing?s:({...s, ...schema, name }));
            await db.write();
            return name;
        } catch (e) { new xError(e).send(reply); }
    });
    route.delete('/', async (request, reply) => {
        const { name } = request.body as { name: string };
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            const db = await database();
            const { data: { schemas } } = db;
            const schema = schemas.find(s=>s.name===name);
            if (!schema) throw new xError("Schema not found.", "name", 404);
            db.data = { ...db.data, schemas: schemas.filter(s=>s.name!==name) };
            await db.write();
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
}