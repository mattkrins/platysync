import { Rule, Condition } from "../../db/models.js";
import { Op } from "sequelize";

export default function ( route ) {
    //route.get('/schema/:name/rules', async (req, res, err) => {
    //    try {
    //        const rules = await Rule.findAll({where:{ SchemaName: req.params.name }, include: [Condition], order: 'index'});
    //        res.json(rules);
    //    } catch (e) { err(e); }
    //});
    route.get('/schema/:name/rules/:id', async (req, res, err) => {
        try {
            const rule = await Rule.findOne({where:{ SchemaName: req.params.name, id: req.params.id }, include: [Condition]});
            res.json(rule);
        } catch (e) { err(e); }
    });
    route.post('/schema/:name/rules', async (req, res, err) => {
        try {
            const { conditions, id, ...rule_ } = req.body;
            const rules = await Rule.findAll({where:{ SchemaName: req.params.name }, raw: true});
            const rule = await Rule.create({ SchemaName: req.params.name, ...rule_, index: rules.length });
            for (const {id, ...condition} of conditions) {
                await Condition.create({ ...condition, SchemaName: req.params.name, RuleId: rule.id });
            }
            res.json(rule);
        } catch (e) { err(e); }
    });
    route.put('/schema/:name/rules/move', async (req, res, err) => {
        try {
            for (const {id, index} of (req.body||[])) await Rule.update({ index },{ where : { id }});
            res.json(true);
        } catch (e) { err(e); }
    });
    route.put('/schema/:name/rules/:id/toggle', async (req, res, err) => {
        try {
            const rule = await Rule.findOne({where:{ SchemaName: req.params.name, id: req.params.id }});
            rule.enabled = !rule.enabled;
            await rule.save();
            res.json(rule);
        } catch (e) { err(e); }
    });
    route.put('/schema/:name/rules/:id/copy', async (req, res, err) => {
        try {
            const rules = await Rule.findAll({where:{ SchemaName: req.params.name }, raw: true});
            const {id, ...rule} = await Rule.findOne({where:{ SchemaName: req.params.name, id: req.params.id }, raw: true, attributes: { exclude: ['enabled'] }});
            const conditions = await Condition.findAll({ where: { SchemaName: req.params.name, RuleId: id }, raw: true, attributes: { exclude: ['id'] }});
            const copy = await Rule.create({...rule, name: `${rule.name} (copy)`, index: rules.length });
            for (const {id, ...condition} of conditions) {
                await Condition.create({ ...condition, SchemaName: req.params.name, RuleId: copy.id});
            }
            res.json(copy);
        } catch (e) { err(e); }
    });
    route.put('/schema/:name/rules/:id', async (req, res, err) => {
        try {
            const rule = await Rule.findOne({where:{ SchemaName: req.params.name, id: req.params.id }});
            const { conditions, ...rule_ } = req.body;
            rule.set(rule_);
            await rule.save();
            await Condition.destroy({ where: { SchemaName: req.params.name, RuleId: rule.id }});
            for (const {id, ...condition} of conditions) {
                await Condition.create({ SchemaName: req.params.name, RuleId: rule.id, ...condition });
            }
            res.json(rule);
        } catch (e) { err(e); }
    });
    route.delete('/schema/:name/rules/:id', async (req, res, err) => {
        try {
            const rules = await Rule.findAll({where:{ SchemaName: req.params.name }, raw: true});
            const rule = await Rule.findOne({where:{ SchemaName: req.params.name, id: req.params.id }});
            for (const {id, index} of rules) await Rule.update({ index: index - 1 },{ where : { id, index: {[Op.gt]: rule.index} }});
            await rule.destroy();
            res.json(true);
        } catch (e) { err(e); }
    });
    

}