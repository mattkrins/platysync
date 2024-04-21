import { FastifyInstance } from 'fastify';
import auth, { useAuth } from './routes/auth.js'
import schema, { schemas } from './routes/schema.js'
import connector from './routes/connector.js'
import pdfPrinter from "pdf-to-printer";
import rule from './routes/rule.js';
import schedule from './routes/schedule.js';
import file from './routes/file.js';
import { engine } from './components/engine.js';
import { xError } from './modules/common.js';
import user from './routes/user.js';
import { Schedule, User, Session } from './db/models.js';
import { db } from './db/database.js';
const { getPrinters } = pdfPrinter;

function addRoute(api: FastifyInstance, prefix: string|undefined, routesToAdd: (route: FastifyInstance)=>Promise<void>|void, auth: boolean = true) {
  api.register( async (route: FastifyInstance)=>{
    if (auth) useAuth(route);
    await routesToAdd(route);
  }, { prefix } );
}

export default function routes(api: FastifyInstance, _opts: unknown, done: () => void) {
  //api.addHook('preHandler', (req: unknown, res: unknown, done: () => void) => setTimeout(done, 500) ); // Arbitrary speed limit; simulate lag.

  addRoute(api, '/auth', auth, false );
  
  addRoute(api, '/user', user );
  addRoute(api, '/schedule', schedule );
  addRoute(api, '/schema', schema );
  addRoute(api, '/schema/:schema_name/storage', file );
  addRoute(api, '/schema/:schema_name/connector', connector );
  addRoute(api, '/schema/:schema_name/rule', rule );
  addRoute(api, '/schema/:schema_name/engine', engine );

  addRoute(api, undefined, (route: FastifyInstance) => {
    route.delete('/reset_cache', async (request, reply) => {
      try { return await schemas.load(); }
      catch (e) { new xError(e).send(reply); }
    });
    route.delete('/reset_all', async (request, reply) => {
      try {
        await db.sync({ alter: true });
        await Schedule.truncate();
        await User.truncate();
        await Session.truncate();
      }
      catch (e) { new xError(e).send(reply); }
    });
    route.get('/printers', async (request, reply) => {
      try { return await getPrinters(); }
      catch (e) { new xError(e).send(reply); }
    });
  });
  
  done();
}