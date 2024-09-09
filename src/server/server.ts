import { FastifyInstance } from "fastify";
import InitPlatySync, { dev, log, version } from "../index";
import { Settings } from "./components/database";
import { initSchedules } from "./components/schedules";

export let server: FastifyInstance;

(async () => {
    try {
        server = await InitPlatySync();
        await initSchedules();
        const settings = await Settings();
        const port = process.env.PSYC_PORT ? parseInt(process.env.PSYC_PORT) : (settings.server?.port || 7528);
        const host = process.env.PSYC_HOST ? process.env.PSYC_HOST : (settings.server?.host || '0.0.0.0');
        server.listen({ port, host }, (err) => {
            if (err) throw err;
            if (!dev) console.log(`> PlatySync started @ http://localhost:${port}`);
            log.info({port, version, https: (!!settings.server?.https), message: 'Server started.'});
        });
    } catch (err) {
        console.error('Critical failure starting server:', err);
        if (log && log.error) log.error({version, message: ((err as Error).message)||JSON.stringify(err)  })
        process.exit(1);
    }
})();
