import { FastifyInstance } from 'fastify';
import auth, { login, useAuth } from './routes/auth.js'
import schema, { initSchemaCache } from './routes/schema.js'
import connector from './routes/connector.js'
import { _Error } from "./server.js";
import pdfPrinter from "pdf-to-printer";
import rule, { rules }  from './routes/rule.js';
import { User } from './db/models.js';
import { form, isNotEmpty, hasLength } from './components/validators.js';
import schedule from './routes/schedule.js';
import storage from './routes/file.js';
const { getPrinters } = pdfPrinter;


function addRoute(api: FastifyInstance, prefix: string, routesToAdd: (route: FastifyInstance)=>void, auth: boolean = true) {
  api.register( (route: FastifyInstance, _opts: unknown, done: () => void)=>{
    if (auth) useAuth(route);
    routesToAdd(route);
    done();
  }, { prefix } );
}

export default function routes(api: FastifyInstance, _opts: unknown, done: () => void) {

  // Arbitrary speed limit; simulate lag.
  //api.addHook('preHandler', (req: unknown, res: unknown, done: () => void) => setTimeout(done, 1000) );

  api.post('/setup', form({
    username: isNotEmpty('Username can not be empty.'),
    password: hasLength({ min: 5 }, 'Password must be at least 5 characters long.')
  }), async (request, reply) => {
    try {
      const { username, password } = request.body as { username: string, password: string, collection: boolean };
      if ((await User.count())>0) return ("Setup is already complete.");
      const user =  await User.create({ username, password, });
      return await login(user);
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });

  api.get('/setup', async (request, reply) => {
    try {
      return {status: (await User.count())>0};
    } catch (e) {
      const error = _Error(e);
      reply.code(500).send({ error: error.message });
    }
  });

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