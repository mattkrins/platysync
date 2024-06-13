import { FastifyInstance } from "fastify";
import { isNotEmpty, validate, xError } from "../modules/common";
import database, { Schemas } from "../components/database";

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
            schemas.push({ name, ...schema });
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
}