import { Schema, Override, Template, Attribute, Group, Rule, Condition } from "../../db/models.js";
import { encrypt, getKey } from '../modules/cryptography.js';
import { loadCSV } from '../modules/common.js';
import multer from "multer";
import { schedule } from "../modules/automation.js";

export default function ( route ) {
    route.get('/schema/:name', async (req, res, err) => {
        try {
            const schema = await Schema.findOne({
                where: { name: req.params.name }, 
                include: [
                    {model: Template, include: [ Attribute, Group ]},
                    {model: Rule, include: [ Condition ], order: ['index'], separate: true},
                    Override
                ]
            });
            res.json(schema);
        } catch (e) { err(e); }
    });
    route.put('/schema/:name', async (req, res, err) => {
        try {
            const {ldap_pass, ...changes} = req.body;
            const schema = await Schema.findOne({ where: { name: req.params.name } });
            const key = await getKey();
            let pass = false;
            try {
                pass = JSON.parse(ldap_pass);
            } catch (e) {
                // Password was updated
            }
            if ((!pass.iv) && ldap_pass.trim()!=="") changes.ldap_pass = JSON.stringify(await encrypt(ldap_pass, key));
            schema.set(changes);
            await schema.save();
            await schedule();
            res.json(schema);
        } catch (e) { err(e); }
    });
    route.delete('/schema/:name', async (req, res, err) => {
        try {
            const schema = await Schema.findOne({ where: { name: req.params.name } });
            schema.destroy();
            res.json(true);
        } catch (e) { err(e); }
    });
    route.get('/schema/:name/csv', async (req, res, err) => {
        try {
            const schema = await Schema.findOne({ where: { name: req.params.name } });
            const parsed = await loadCSV(schema.csv_path);
            res.json(parsed);
        } catch (e) { err(e); }
    });
    route.get('/schema', async (req, res, err) => {
        try {
            const schemas = await Schema.findAll();
            res.json(schemas);
        } catch (e) { err(e); }
    });
    route.post('/schema', async (req, res, err) => {
        try {
            const schema = await Schema.create({ name: req.body.name });
            res.json(schema);
        } catch (e) { err(e); }
    });
    route.post('/schema/:name/overrides', async (req, res, err) => {
        try {
            await Override.destroy({ where: { SchemaName: req.params.name }});
            for (const condition of req.body.overrides) await Override.create({ SchemaName: req.params.name, ...condition });
            res.json(true);
        } catch (e) { err(e); }
    });

    route.get('/schema/:name/export', async (req, res, err) => {
        try {
            const schema = await Schema.findOne({
                where: { name: req.params.name }, 
                include: [
                    {model: Template, include: [ Attribute, Group ]},
                    {model: Rule, include: [ Condition ]},
                    Override
                ]
            });

            res.setHeader('Content-disposition', `attachment; filename=${schema.name}.json`);
            res.setHeader('Content-type', 'application/json');
            res.write(JSON.stringify(schema, null, 2), function (err) {
              res.end();
            });

        } catch (e) { err(e); }
    });

    const storage = multer.memoryStorage();
    const upload = multer({ storage });
    route.post('/schema/:name/import', upload.single('file'), async (req, res, err) => {
        try {
            const {Templates, Rules, Overrides, ...uploaded} = JSON.parse(req.file.buffer.toString());
            const schema = await Schema.findOne({ where: { name: req.params.name } });
            schema.set(uploaded);
            await schema.save();
            await Override.destroy({ where: { SchemaName: schema.name }});
            for (const {id, SchemaName, ...override} of Overrides) await Override.create({ SchemaName: schema.name, ...override });
            await Template.destroy({ where: { SchemaName: schema.name }});
            await Attribute.destroy({ where: { SchemaName: schema.name }});
            await Group.destroy({ where: { SchemaName: schema.name }});
            const TemplateIds = {};
            for (const {id, SchemaName, Attributes, Groups, ...template} of Templates){
                const newTemplate = await Template.create({ SchemaName: schema.name, ...template });
                TemplateIds[id] = newTemplate.id;
                for (const {id, SchemaName, TemplateId, ...attribute} of Attributes) await Attribute.create({ SchemaName: schema.name, TemplateId: newTemplate.id, ...attribute });
                for (const {id, SchemaName, TemplateId, ...group} of Groups) await Group.create({ SchemaName: schema.name, TemplateId: newTemplate.id, ...group });
            }
            await Rule.destroy({ where: { SchemaName: schema.name }});
            await Condition.destroy({ where: { SchemaName: schema.name }});
            for (const {id, SchemaName, TemplateId, Conditions, ...rule} of Rules){
                const newRule = await Rule.create({ SchemaName: schema.name, TemplateId: TemplateIds[TemplateId], ...rule });
                for (const {id, SchemaName, RuleId, ...condition} of Conditions) await Condition.create({ SchemaName: schema.name, RuleId: newRule.id, ...condition });
            }

            
            res.json(schema);
        } catch (e) { err(e); }
    });

}