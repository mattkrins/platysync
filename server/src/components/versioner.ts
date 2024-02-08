import { mutateSchemaCache } from "../routes/schema.js";
import { log, path } from "../server.js";
import { writeYAML } from "../storage.js";
import { Schema } from "../typings/common.js";

const versions: {
    min?: number,
    max?: number,
    upgrade: (schema: Schema) => void
}[] = [
    {
        max: 0.4,
        upgrade: (schema: Schema) => { try {
            for (const rule of schema.rules){
                for (const condition of rule.conditions){
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
                schema._rules[schema.name] = rule;
            }
            log.info(`Upgraded ${schema.name} from 0.4 to 0.5.`);
        } catch (e) { log.error(`Failed to upgrade ${schema.name}.`, e); }
        //const filePath = `${path}/schemas/${schema.name}/rules.yaml`;
        //writeYAML(schema.rules, filePath);
        //schema.version = 0.5;
        //mutateSchemaCache(schema);
    }}
]

export default async function versioner(cached: Schema) {
    const schema = {...cached};
    if (schema.version === 0.4){
        for (const version of versions){
            if (version.max && schema.version > version.max) continue;
            if (version.min && schema.version < version.min) continue;
            log.info(`Upgrade detected for schema '${schema.name}'.`);
            version.upgrade(schema);
        }
    }

}