import * as fs from 'fs';
import YAML from 'yaml'
import { Schema } from './components/models.js';
const dataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");

const versions: {
    min?: number,
    max?: number,
    upgrade: (schema: Schema) => Promise<void>
}[] = [ ];

async function evaluate(schema: Schema) {
    for (const version of versions){
        if (version.max && parseFloat(schema.version) > version.max) continue;
        if (version.min && parseFloat(schema.version) < version.min) continue;
        console.log(`Upgrade detected for schema '${schema.name}'.`);
        await version.upgrade(schema);
    }
}

await (async function(){
    const version = process.env.npm_package_version;
    if (!version){ console.error("Unable to determin ver. Exiting..."); return process.exit(1); }
    console.log(`Detected ver ${version}`);
    const schemasPath = `${dataPath}/cdapp/schemas/`;
    const all = fs.readdirSync(schemasPath);
    const files = all.filter(o => fs.statSync(`${schemasPath}/${o}`).isFile() && (o.includes("yaml")||o.includes("yml")) );
    for (const file of files){
        try {
            const schema = YAML.parse(`${schemasPath}/${file}`) as Schema;
            if (!schema.version) continue;
            if (String(schema.version)!==version) continue;
            await evaluate(schema);
        } catch (e) { console.warn("Unexpected file in schemas", e); continue; }
    }
})();