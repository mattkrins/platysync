import { FastifyInstance } from "fastify";
import { isNotEmpty, validate, xError } from "../modules/common";
import database, { Schemas } from "../components/database";
import { version } from "../../server";

interface newSchema extends Schema {
    importing?: boolean;
}

export default async function schema(route: FastifyInstance) {
    route.get('/:name', async (request, reply) => {
        const { name } = request.params as { name: string};
        try {
            const schemas = await Schemas();
            const schema = schemas.find(s=>s.name===name);
            if (!schema) throw new xError("Schema not found.", null, 404).send(reply);
            return schema;
        } catch (e) { new xError(e).send(reply); }
    });
    route.get('s', async (request, reply) => {
        try {
            return await Schemas();
        } catch (e) { new xError(e).send(reply); }
    });
    route.post('/', async (request, reply) => {
        const { name, importing, ...schema } = request.body as newSchema;
        try {
            validate( { name }, {
                name: isNotEmpty('Name can not be empty.'),
            });
            if (importing) {
                if (!schema.version) throw new xError("Malformed structure.");
            }
            const db = await database();
            const { data: { schemas } } = db;
            if (schemas.find(s=>s.name===name)) throw new xError("Schema name taken.", "name", 409);
            schemas.push({ name, ...schema, version });
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
            db.data = { ...db.data, schemas: schemas.filter(s=>s.name!==name) };
            await db.write();
            return true;
        } catch (e) { new xError(e).send(reply); }
    });
    route.put('/:editing', async (request, reply) => {
        const { editing } = request.params as { editing: string };
        const { name, importing, ...schema } = request.body as newSchema;
        try {
            validate( { name, editing }, {
                name: isNotEmpty('Name can not be empty.'),
                editing: isNotEmpty('Username Param can not be empty.'),
            });
            if (importing) {
                if (!schema.version) throw new xError("Malformed structure.");
            }
            const db = await database();
            const { data: { schemas } } = db;
            const old_schema = schemas.find(s=>s.name===editing);
            if (!old_schema) throw new xError("Schema not found.", "name", 404);
            if (schemas.find(s=>s.name===name)) throw new xError("Schema name taken.", "name", 409);
            db.data.schemas = schemas.map(s=>s.name!==editing?s:({...s, ...schema, name }));
            await db.write();
            return name;
        } catch (e) { new xError(e).send(reply); }
    });
}