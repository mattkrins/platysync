import fs from 'fs';
import { Print, Schema } from "../../db/models.js";
import { io } from '../index.js';
import pdfPrinter from "pdf-to-printer";
import { dataPath } from '../../db/database.js'
const { print, getPrinters } = pdfPrinter;

export const printPath = `${dataPath}/print`;

export async function printJob(id){
    const job = await Print.findOne({ where: { id } });
    try{
        const schema = await Schema.findOne({ where: { name: job.SchemaName }, raw: true });
        job.status = 2;
        io.emit(`prints`, {[id]: "Spooling"});
        job.save();
        if (!fs.existsSync(job.path)) throw ("Print file does not exist on the file system");
        let options = {};
        if (schema.printer!=="System Default") options = { printer: schema.printer };
        await print(job.path, options);
        job.status = 3; // todo: ondelete?
        io.emit(`prints`, {[id]: "Complete"});
        job.save();
    } catch (e) {
      job.status = 0;
      io.emit(`prints`, {[id]: "Error"});
      job.save();
      throw Error(e);
    }
}

export default function ( route ) {
    
    route.get('/printers', async (req, res, err) => {
        try {
            const printers = await getPrinters();
            res.json(printers);
        } catch (e) { err(e); }
    });
    
    route.post('/print/:id', async (req, res, err) => {
        try {
            await printJob(req.params.id);
            res.json(true);
        } catch (e) { err(e); }
    });
    
    route.post('/print', async (req, res, err) => {
        try {
            let options = {};
            if (req.body.SchemaName) options = { where: { name: req.body.SchemaName } };
            const jobs = await Print.findAll(options);
            for (const job of jobs) {
                try { await printJob(job.id); }
                catch (e) { continue; }
            }
            res.json(true);
        } catch (e) { err(e); }
    });
    
    route.delete('/print/:id', async (req, res, err) => {
        try {
            const job = await Print.findOne({where:{ id: req.params.id }});
            if (fs.existsSync(job.path)) fs.unlinkSync(job.path);
            io.emit(`prints`, {[job.id]: "Deleted"});
            job.destroy();
            res.json(true);
        } catch (e) { err(e); }
    });

}