import { Schemas } from "./database";


async function initSchedule(schedule: Schedule, schemaName: string) {
    for (const trigger of schedule.triggers) {
        
    }
}

async function init() {
    const schemas = await Schemas();
    for (const { name, schedules } of schemas) {
        for (const schedule of schedules) {
            await initSchedule(schedule, name);
        }
    }
}