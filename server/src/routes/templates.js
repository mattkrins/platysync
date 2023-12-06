import { Template, Attribute, Group } from "../../db/models.js";

export default function ( route ) {
    route.get('/template', async (req, res, err) => {
        try {
            const templates = await Template.findAll();
            res.json(templates);
        } catch (e) { err(e); }
    });
    route.post('/template', async (req, res, err) => {
        try {
            const { schemaName } = req.body;
            const template = await Template.create({ SchemaName: schemaName });
            res.json(template);
        } catch (e) { err(e); }
    });
    route.get('/template/:id', async (req, res, err) => {
        try {
            const template = await Template.findOne({ where: { id: req.params.id }, include: [ Attribute, Group ] });
            res.json(template);
        } catch (e) { err(e); }
    });
    route.put('/template/:id', async (req, res, err) => {
        try {
            const { template: changes, attributes, groups } = req.body;
            const template = await Template.findOne({ where: { id: req.params.id } });
            template.set(changes);
            await template.save();

            await Attribute.destroy({ where: { SchemaName: template.SchemaName, TemplateId: template.id }})
            for (const attribute of attributes) {
                await Attribute.create({ SchemaName: template.SchemaName, TemplateId: template.id, ...attribute });
            }

            await Group.destroy({ where: { SchemaName: template.SchemaName, TemplateId: template.id }})
            for (const group of groups) {
                await Group.create({ SchemaName: template.SchemaName, TemplateId: template.id, ...group });
            }

            res.json(template);
        } catch (e) { err(e); }
    });
    route.delete('/template/:id', async (req, res, err) => {
        try {
            const template = await Template.findOne({ where: { id: req.params.id } });
            template.destroy();
            res.json(true);
        } catch (e) { err(e); }
    });
}