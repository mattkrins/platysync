import { path } from '../server.js';
import * as fs from 'fs';
import { _Error } from "../server.js";
import { deleteFolderRecursive, readYAML, writeYAML } from "../storage.js";
import { form, validWindowsFilename } from "../components/validators.js";
import AdmZip from 'adm-zip';
import multer from 'fastify-multer';
import YAML from 'yaml';
import { getHeaders } from "./connector.js";
export let schemas = [];
export let _schemas = {};
async function buildHeaders(connectors) {
    const headers = {};
    for (const connector of connectors) {
        if (!getHeaders[connector.id])
            continue;
        headers[connector.name] = await getHeaders[connector.id](connector);
    }
    return headers;
}
export async function initSchemaCache() {
    schemas = [];
    _schemas = {};
    const schemasPath = `${path}/schemas`;
    if (!fs.existsSync(schemasPath))
        fs.mkdirSync(schemasPath);
    const files = fs.readdirSync(schemasPath);
    for (const name of files) {
        const filePath = `${schemasPath}/${name}/schema.yaml`;
        const yaml = readYAML(filePath);
        const connectors = readYAML(`${schemasPath}/${name}/connectors.yaml`) || [];
        const _connectors = connectors.reduce((acc, c) => (acc[c.name] = c, acc), {});
        const rules = readYAML(`${schemasPath}/${name}/rules.yaml`) || [];
        const _rules = rules.reduce((acc, r) => (acc[r.name] = r, acc), {});
        let headers = {};
        const errors = [];
        try {
            headers = await buildHeaders(connectors);
        }
        catch (e) {
            errors.push(_Error(e).message);
        }
        const schema = {
            ...yaml,
            connectors,
            _connectors,
            rules,
            _rules,
            headers,
            errors,
        };
        _schemas[yaml.name] = schema;
        schemas.push(schema);
    }
}
export function getSchema(name, reply) {
    if ((name in _schemas))
        return _schemas[name];
    if (reply)
        throw reply.code(404).send({ error: "Schema not found." });
    throw Error("Schema not found.");
}
export default function schema(route) {
    initSchemaCache();
    const schemasPath = `${path}/schemas`;
    route.get('/', async () => schemas);
    route.post('/', form({
        name: validWindowsFilename('Invalid schema name.'),
    }), async (request, reply) => {
        try {
            const { name } = request.body;
            if (name in _schemas)
                throw reply.code(409).send({ validation: { name: "Schema name taken." } });
            const folderPath = `${schemasPath}/${name}`;
            fs.mkdirSync(folderPath);
            const schema = { name, version: 0.4, connectors: [], _connectors: {}, rules: [], _rules: {}, headers: {} };
            writeYAML(schema, `${folderPath}/schema.yaml`);
            writeYAML('', `${folderPath}/rules.yaml`);
            writeYAML('', `${folderPath}/connectors.yaml`);
            _schemas[name] = schema;
            schemas.push(schema);
            return schema;
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
    route.get('/:name/export/:bearer', async (request, reply) => {
        const { name } = request.params;
        try {
            getSchema(name, reply);
            const folderPath = `${path}/schemas/${name}`;
            if (!fs.existsSync(folderPath))
                throw reply.code(404).send({ error: "Folder not found." });
            const zipFileName = `${name}-export.zip`;
            const zip = new AdmZip();
            zip.addLocalFolder(folderPath);
            const zipBuffer = zip.toBuffer();
            reply.header('Content-Disposition', `attachment; filename=${zipFileName}`);
            reply.type('application/zip');
            reply.send(zipBuffer);
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });
    route.register(multer.contentParser);
    route.post('/:name/import', { preValidation: upload.single('file') }, async (request, reply) => {
        const { name } = request.params;
        try {
            const schema = getSchema(name, reply);
            const { buffer } = request.file;
            const zip = new AdmZip(buffer);
            const zipEntries = zip.getEntries();
            const schemaFile = zipEntries.filter(e => e.entryName === "schema.yaml");
            if (schemaFile.length <= 0)
                throw Error("Invalid schema structure.");
            const contents = schemaFile[0].getData().toString("utf8");
            const yaml = YAML.parse(contents);
            const folderPath = `${path}/schemas/${name}`;
            zip.extractAllTo(folderPath, true);
            const mutated = { ...schema, ...yaml, name };
            writeYAML(mutated, `${folderPath}/schema.yaml`);
            _schemas[name] = mutated;
            schemas = schemas.map(s => s.name !== name ? s : mutated);
            return true;
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
    route.get('/:name', async (request, reply) => {
        const { name } = request.params;
        try {
            return getSchema(name, reply);
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
    route.delete('/:name', async (request, reply) => {
        const { name } = request.params;
        try {
            getSchema(name, reply);
            deleteFolderRecursive(`${path}/schemas/${name}`);
            delete _schemas[name];
            schemas = schemas.filter(s => s.name !== name);
            return true;
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
    route.put('/:name', form({
        name: validWindowsFilename('Invalid schema name.'),
    }), async (request, reply) => {
        const { name } = request.params;
        const { name: newName, connectors, rules, ...mutations } = request.body;
        try {
            const schema = getSchema(name, reply);
            let writePath = `${path}/schemas/${name}`;
            const mutated = { ...schema, ...mutations, name: newName };
            if (name !== newName) {
                if (newName in _schemas)
                    throw reply.code(409).send({ validation: { name: "Schema name taken." } });
                const newPath = `${path}/schemas/${newName}`;
                fs.renameSync(writePath, newPath);
                writePath = `${path}/schemas/${newName}`;
                delete _schemas[name];
                _schemas[newName] = mutated;
                schemas = schemas.filter(s => s.name !== name);
                schemas.push(mutated);
            }
            else {
                _schemas[name] = mutated;
                schemas = schemas.map(s => s.name !== name ? s : mutated);
            }
            const filePath = `${writePath}/schema.yaml`;
            writeYAML(mutated, filePath);
            return true;
        }
        catch (e) {
            const error = _Error(e);
            reply.code(500).send({ error: error.message });
        }
    });
}
