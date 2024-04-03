import { FastifyInstance } from 'fastify';
import auth, { useAuth } from './routes/auth.js'
import schema, { initSchemaCache } from './routes/schema.js'
import connector from './routes/connector.js'
import { _Error } from "./server.js";
import pdfPrinter from "pdf-to-printer";
import rule, { rules }  from './routes/rule.js';
import schedule from './routes/schedule.js';
import storage from './routes/file.js';
const { getPrinters } = pdfPrinter;

function addRoute(api: FastifyInstance, prefix: string, routesToAdd: (route: FastifyInstance)=>Promise<void>|void, auth: boolean = true) {
  api.register( async (route: FastifyInstance)=>{
    if (auth) useAuth(route);
    await routesToAdd(route);
  }, { prefix } );
}

export default function routes(api: FastifyInstance, _opts: unknown, done: () => void) {

  // Arbitrary speed limit; simulate lag.
  api.addHook('preHandler', (req: unknown, res: unknown, done: () => void) => setTimeout(done, 500) );

  addRoute(api, '/auth', auth, false );
  
  addRoute(api, '/schedule', schedule );
  addRoute(api, '/schema', schema );
  addRoute(api, '/schema/:schema_name/storage', storage );
  addRoute(api, '/schema/:schema_name/connector', connector );
  addRoute(api, '/schema/:schema_name/rules', rules );
  addRoute(api, '/schema/:schema_name/rule', rule );

  api.get('/fix', async (request, reply) => {
    try {
        await initSchemaCache();
        return true;
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });

  api.get('/printers', async (request, reply) => {
    try {
        return await getPrinters();
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });

  done();
}