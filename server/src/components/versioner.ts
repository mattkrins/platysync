import { db } from "../db/database.js";
import { mutateSchema } from "../routes/schema.js";
import { log, path } from "../server.js";
import { readYAML } from "../storage.js";
import { Condition, Schema } from "../typings/common.js";
import * as fs from 'fs';

const versions: {
    min?: number,
    max?: number,
    upgrade: (schema: Schema) => Promise<void>
}[] = [
    {
        max: 0.4,
        upgrade: async (schema: Schema) => { try {
            await db.sync( { alter: true} );
            for (const rule of schema.rules){
                const upgrade = (conditions: Condition[]) => {
                    for (const condition of conditions){
                        switch (condition.operator) {
                            case 'exists': { condition.operator = "ldap.exists"; break; }
                            case 'notexists': { condition.operator = "ldap.notexists"; break; }
                            case 'enabled': { condition.operator = "ldap.enabled"; break; }
                            case 'disabled': { condition.operator = "ldap.disabled"; break; }
                            case 'member': { condition.operator = "ldap.member"; break; }
                            case 'notmember': { condition.operator = "ldap.notmember"; break; }
                            case 'child': { condition.operator = "ldap.child"; break; }
                            case 'notchild': { condition.operator = "ldap.notchild"; break; }
                            default: break;
                        }
                    }
                }
                upgrade(rule.conditions);
                for (const action of rule.actions||[]){
                    if (action.name!=="Comparator" || !action.conditions) continue;
                    upgrade(action.conditions);
                }
                for (const action of rule.before_actions||[]){
                    if (action.name!=="Comparator" || !action.conditions) continue;
                    upgrade(action.conditions);
                }
                for (const action of rule.after_actions||[]){
                    if (action.name!=="Comparator" || !action.conditions) continue;
                    upgrade(action.conditions);
                }
            }
            log.info(`Upgraded ${schema.name} from 0.4 to 0.5.`);
        } catch (e) { log.error(`Failed to upgrade ${schema.name}.`, e); }
        schema.version = 0.5;
        mutateSchema(schema, true, true);
        const folder = `${path}/schemas/${schema.name}`;
        fs.renameSync(folder, `${folder}.backup`);
    }}
]

async function evaluate(schema: Schema) {
    for (const version of versions){
        if (version.max && schema.version > version.max) continue;
        if (version.min && schema.version < version.min) continue;
        log.info(`Upgrade detected for schema '${schema.name}'.`);
        await version.upgrade(schema);
    }
}

export default async function versioner() {
    const folderPath = `${path}/schemas/`;
    const all = fs.readdirSync(`${path}/schemas/`);
    const folders = all.filter(o => fs.statSync(`${folderPath}/${o}`).isDirectory() );
    const files = all.filter(o => fs.statSync(`${folderPath}/${o}`).isFile() );
    for (const folder of folders){
        if (folder.includes(".backup")) continue;
        const yaml: Schema = readYAML(`${folderPath}/${folder}/schema.yaml`);
        const connectors: Schema['connectors'] = readYAML(`${folderPath}/${folder}/connectors.yaml`) || [];
        const rules: Schema['rules'] = readYAML(`${folderPath}/${folder}/rules.yaml`) || [];
        const schema = { ...yaml, connectors, rules };
        await evaluate(schema);
    }
    for (const file of files){
        try {
            const schema: Schema = readYAML(`${folderPath}/${file}`);
            if (!schema.version) continue;
            await evaluate(schema);
        } catch (e) { log.warn("Unexpected file in schemas", e); continue; }
    }

}