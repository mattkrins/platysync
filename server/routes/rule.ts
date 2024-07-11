import { FastifyInstance } from "fastify";
import { xError } from "../modules/common";
import { getSchema } from "../components/database";
import evaluate from "../components/engine";
import pdfPrinter from "pdf-to-printer";
import unixPrint from "unix-print";
//TODO - implement unix print in action

export default async function (route: FastifyInstance) {
    route.post('/evaluate', async (request, reply) => {
        const { schema_name } = request.params as { schema_name: string };
        const rule = request.body as Rule;
        try {
            const schema = await getSchema(schema_name);
            return await evaluate(rule, schema);
        }
        catch (e) { new xError(e).send(reply); }
    });
    route.get('/getPrinters', async (request, reply) => {
        try {
            const windows = process.platform === "win32";
            if (windows) return (await pdfPrinter.getPrinters()).map(p=>p.name);
            return (await unixPrint.getPrinters()).map(p=>p.printer);
        }
        catch (e) { new xError(e).send(reply); }
    });
}