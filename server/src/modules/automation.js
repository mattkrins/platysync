import fs from "fs";
import Cron from "croner";
import { Schema } from "../../db/models.js";
import { run } from '../routes/actions.js'

const cronJobs = {};
const monitored = {};
export async function schedule() {
    for (const name of (Object.keys(monitored)||[])) {
        if (!monitored[name]) continue;
        monitored[name].close();
        delete monitored[name];
        console.log(`${name} no longer monitoring CSV.`)
    }
    for (const name of (Object.keys(cronJobs)||[])) {
        if (!cronJobs[name]) continue;
        cronJobs[name].stop();
        delete cronJobs[name];
        console.log(`Stopping CRON for ${name}.`)
    }
    const schemas = await Schema.findAll({ raw: true });
    for (const schema of (schemas||[])) {
        const res = {json: () => {} }
        const err = console.error;
        if (schema.use_cron){
            console.log(`CRON schedule enabled for ${schema.name}.`);
            cronJobs[schema.name] = Cron(schema.cron, {timezone: "Australia/Victoria"}, async () => {
                console.log(`Running ${schema.name} schema CRON job...`);
                await run(res, err, Boolean(schema.autoexe), schema.name );
            });
        }
        if (schema.csv_monitor){
            console.log(`${schema.name} schema is monitoring CSV.`);
            monitored[schema.name] = fs.watch(schema.csv_path, async (eventname, filename) => {
                if (!filename || !eventname) return;
                console.log("Changes detected to", schema.csv_path);
                await run(res, err, Boolean(schema.autoexe), schema.name );
            });
        }
    }
}