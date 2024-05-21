import { FastifyInstance } from "fastify";
import { wait, xError } from "../modules/common.js";
import { Schedule } from "../db/models.js";
import { Rule, Schema } from "../components/models.js";
import { schemas } from "./schema.js";
import { history, testing } from "../server.js";
import Cron from "croner";
import fs from 'fs-extra';
import process, { processActions } from "../components/engine.js";

function validate( body: { schema: string, type: string, value: string } ): Schema {
  if (body.type==="cron") {
    try {
      const job = Cron(body.value, {timezone: "Australia/Victoria"}); job.nextRun(); job.stop();
    } catch (e) { throw new xError((e as Error).message); }
  }
  if (body.type==="monitor" && !fs.existsSync(body.value)) throw new xError("File path does not exist.", "value", 404);
  return schemas.get(body.schema);
}

const errors: { [k: string]:  string } = {};
const scheduled: { [k: string]:  Cron } = {};
const watching: { [k: string]:  fs.FSWatcher } = {};
export async function stop(schedule: Schedule) {
  history.debug({schema: schedule.schema, schedule: schedule.id, message: 'Stopping Schedule.'});
  try {
    const s = await Schedule.findOne({where: { id: schedule.id } });
    if (s){ s.enabled = false; await s.save(); }
    switch (schedule.type) {
      case "monitor": {
        if (!watching[schedule.id]) return;
        watching[schedule.id].close();
        delete watching[schedule.id];
        break;
      }
      case "cron": {
        if (!scheduled[schedule.id]) return;
        scheduled[schedule.id].stop();
        delete scheduled[schedule.id];
        break;
      }
      default: break;
    }
  } catch (e) {
    const message = (new xError(e)).message;
    history.error({schema: schedule.schema, schedule: schedule.id, message});
    errors[schedule.id] = message;
  }
}
async function run(schedule: Schedule) {
  if (!schedule.enabled) return stop(schedule);
  if (!watching[schedule.id] && !scheduled[schedule.id]) throw new xError("Schedule is not started.");
  delete errors[schedule.id];
  const info = schedule.type==="cron" ? {nextRun: scheduled[schedule.id].nextRun()} : { changeDetected: true };
  const rules: string[] = JSON.parse(schedule.rules||"[]")||[];
  history.info({schema: schedule.schema, rule: rules.length === 0 ? 'all' : rules.join(','), schedule: schedule.id, message: 'Running Schedule.', ...info});
  const schema = validate(schedule);
  for (const rule of schema.rules||[]){
    if ( rules.length > 0 && !rules.includes(rule.name) ) continue;
    if (!rule.enabled) continue;
    const processed = await process( schema, rule );
    const limitTo =  processed.evaluated.filter(e=>e.actionable).map(e=>e.id)||[];
    if (limitTo.length<=0){
      history.info({schema: schedule.schema, rule: rule.name, schedule: schedule.id, message: `No actions to process in rule: ${rule.name}.`});
    } else {
      history.info({schema: schedule.schema, rule: rule.name, schedule: schedule.id, message: `${limitTo.length} actions to process in rule: ${rule.name}.`});
      return await processActions( schema, rule, limitTo );
    }
  }
}
function handle(e: xError, schedule: Schedule){
  const message = (new xError(e)).message;
  history.error({schema: schedule.schema, schedule: schedule.id, message});
  errors[schedule.id] = message;
}
function start(schedule: Schedule) {
  if (!schedule.enabled||!schedule.id) return;
  delete errors[schedule.id];
  history.debug({schema: schedule.schema, schedule: schedule.id, message: 'Starting Schedule.'});
  try {
    validate(schedule);
    switch (schedule.type) {
      case "monitor": {
        watching[schedule.id] = fs.watch(schedule.value, async (e, f)=> {
          if (!f||!e) throw new xError("Failed to init watcher.");
          try {
            await wait(2000); // Wait a few seconds for file writing to complete.
            await run(schedule);
          } catch (e) { handle(e as xError, schedule); }
        })
        watching[schedule.id].on('error', (e: xError) => {
          handle(e as xError, schedule);
        });
        break;
      }
      case "cron": {
        scheduled[schedule.id] = Cron(schedule.value, {timezone: "Australia/Victoria", catch: (e) =>{
          handle(e as xError, schedule);
        }}, async () => {
          try { await run(schedule); } catch (e) { handle(e as xError, schedule); }
        });
        break;
      }
      default: break;
    }
  } catch (e) { handle(e as xError, schedule); }
}

async function init() {
  const schedules = await Schedule.findAll();
  for (const schedule of schedules) start(schedule);
}

export default async function (route: FastifyInstance) {
  if (!testing) setTimeout(init, 5000);
  // Get all Schedules
  route.get('/', async (_, reply) => {
    try { return (await Schedule.findAll({ raw: true })).map(s=>errors[s.id]?({...s, error: errors[s.id]}):s); }
    catch (e) { new xError(e).send(reply); }
  });
  route.post('/', async (request, reply) => {
    const { rules, ...body } = request.body as { schema: string, rules: Rule[], type: string, value: string };
    try {
      validate(body);
      const schedule = {...body, rules: rules.length>0 ? JSON.stringify(rules): null  };
      return await Schedule.create(schedule);
    }
    catch (e) { new xError(e).send(reply); }
  });
  route.put('/', async (request, reply) => {
    const { rules, ...body } = request.body as Schedule;
    try {
      validate(body);
      const schedule = await Schedule.findOne({where: { id: body.id } });
      if (!schedule) throw new xError("Schedule not found.", undefined, 404);
      if (schedule.enabled) stop(schedule);
      const { id, index, enabled, createdAt, error, ...changes} = {...body, rules: rules.length>0 ? JSON.stringify(rules): null };
      const updated = await schedule.update(changes);
      return updated;
    }
    catch (e) { new xError(e).send(reply); }
  });
  route.delete('/', async (request, reply) => {
    const { id } = request.body as { id: string };
    try {
      const schedule = await Schedule.findOne({where: { id } });
      if (!schedule) throw new xError("Schedule not found.", undefined, 404);
      if (schedule.enabled) await stop(schedule);
      return await schedule.destroy();
    }
    catch (e) { new xError(e).send(reply); }
  });
  route.post('/copy', async (request, reply) => {
    const { id: Fid } = request.body as { id: string };
    try {
      const schedule = await Schedule.findOne({where: { id: Fid }, raw: true });
      if (!schedule) throw new xError("Schedule not found.", undefined, 404);
      const { id, index, enabled, createdAt, error, ...copy} = schedule;
      return await Schedule.create(copy);
    }
    catch (e) { new xError(e).send(reply); }
  });
  route.put('/toggle', async (request, reply) => {
    const { id } = request.body as { id: string };
    try {
      const schedule = await Schedule.findOne({where: { id } });
      if (!schedule) throw new xError("Schedule not found.", undefined, 404);
      schedule.enabled = !schedule.enabled;
      if (schedule.enabled) { start(schedule); } else { await stop(schedule); }
      return await schedule.save();
    }
    catch (e) { new xError(e).send(reply); }
  });
  route.put('/reorder', async (request, reply) => {
    const { from, to } = request.body as { from: number, to: number };
    try {
      if (from===to) return true;
      const s1 = await Schedule.findOne({where: { index: from } });
      const s2 = await Schedule.findOne({where: { index: to } });
      if (!s1 || !s2) throw new xError("Schedules not found.", undefined, 404);
      s1.index = to;
      s2.index = from;
      s1.save();
      s2.save();
      if (from===to) return true;
    }
    catch (e) { new xError(e).send(reply); }
  });
}