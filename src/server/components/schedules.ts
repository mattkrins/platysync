import { wait, xError } from "../modules/common";
import fs from 'fs-extra';
import Cron from "croner";
import evaluate from "./engine";
import { getSchedules, getSchema, getSchemas } from "./database";

const schedules: { [k: string]: scheduled } = {};
//TODO - failAfter, disableAfter
export async function initSchedule(schedule_name: string, schema_name: string) {
    const schema = await getSchema(schema_name);
    const schedules = await getSchedules(schema_name);
    const schedule = schedules.find(c=>c.name===schedule_name);
    if (!schedule) throw new xError("Schedule not found.", "name", 404 );
    return new scheduled(schedule, schema);
}

export async function initSchedules() {
    const schemas = await getSchemas();
    for (const schema of schemas){
        for (const schedule of schema.schedules||[]){
            new scheduled(schedule, schema);
        }
    }
}

export function stopSchedule(schedule_name: string, schema_name: string) {
    if (!schedules[`${schema_name}.${schedule_name}`]) return;
    schedules[`${schema_name}.${schedule_name}`].stop();
    delete schedules[`${schema_name}.${schedule_name}`];
}

export async function executeSchedule(schedule_name: string, schema_name: string) {
    if (!schedules[`${schema_name}.${schedule_name}`]) return;
    await schedules[`${schema_name}.${schedule_name}`].execute();
}

export class scheduled {
    tasks: (() => Promise<void>)[] = [];
    watching: fs.FSWatcher[] = [];
    waiting_jobs: Cron[] = [];
    constructor(options: Schedule, schema: Schema) {
        if (schedules[`${schema.name}.${options.name}`]) {
            schedules[`${schema.name}.${options.name}`].stop();
            delete schedules[`${schema.name}.${options.name}`];
        }
        if (!options.enabled) return;
        schedules[`${schema.name}.${options.name}`] = this;
        for (let i=0; i<options.tasks.length; ++i) {
            const task = options.tasks[i];
            if (!task.enabled) continue;
            let func = async () => {};
            switch (task.name) {
                case "run": {
                    func = async () => {
                        try {
                            if (!task.enabled) return;
                            const run = async (rules: Rule[]) => {
                                for (const rule of rules){
                                    if (!rule.enabled) return;
                                    const response = await evaluate(rule, schema);
                                    const results = response.primaryResults.filter(r=>!r.error).map(r=>r.id);
                                    await evaluate(rule, schema, results||[], true);
                                }
                            }
                            if (!task.rules) return await run(schema.rules);
                            return await run(schema.rules.filter(r=>task.rules?.includes(r.name)));
                        } catch (e) { this.error(e as xError); }
                    };
                    break;
                }
                default: continue;
            }
            this.tasks[i] = func;
        }
        for (let i=0; i<options.triggers.length; ++i) {
            const trigger = options.triggers[i];
            if (!trigger.enabled) continue;
            switch (trigger.name) {
                case "watch": {
                    try {
                        const watcher = fs.watch(trigger.watch, async (e, f)=> {
                            if (!f||!e) throw new xError("Failed to init watcher.");
                            try {
                                if (!trigger.enabled) return;
                                await wait(Number(trigger.delay||1000));
                                await this.execute();
                            } catch (e) { this.error(e as xError); }
                        });
                        this.watching[i] = watcher;
                    } catch (e) { this.error(e as xError); }
                    break;
                }
                case "cron": {
                    try {
                        const job = Cron(trigger.cron, {timezone: trigger.timezone||"Australia/Victoria",
                            catch: (e) =>{ this.error(e as xError); }}, async () => {
                            try {
                                if (!trigger.enabled) return;
                                if (trigger.delay) await wait(Number(trigger.delay));
                                await this.execute();
                            } catch (e) { this.error(e as xError); }
                        });
                        this.waiting_jobs[i] = job;
                    } catch (e) { this.error(e as xError); }
                    break;
                }
                default: continue;
            }
        }
    }
    async execute() {
        try {
            for (const task of this.tasks) await task();
        } catch (e) { this.error(e as xError); }
    }
    stop() {
        for (const watcher of this.watching) watcher.close();
        for (const job of this.waiting_jobs) job.stop();
    }
    error(e: xError) {
        console.error(e);
        //history.error({schema: schedule.schema, schedule: schedule.id, message});
    }
}