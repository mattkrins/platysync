import { Setting } from "../../db/models.js";
import { encrypt, getKey } from '../modules/cryptography.js';
import multer from "multer";

export default function ( route ) {
    route.get('/settings', async (req, res, err) => {
        try {
            const settings_ = {
                proxy: "",
                edustar_user: "",
                edustar_pass: "",
                school_id: "",
                cache_policy: 24
            };
            const settings = await Setting.findAll();
            for (const setting of settings) settings_[setting.key] = setting.value;
            res.json(settings_);
        } catch (e) { err(e); }
    });
    route.put('/settings', async (req, res, err) => {
        try {
            const {edustar_pass, ...changes} = req.body;
            const settings = Object.keys(changes).map((k) => k);


            const key = await getKey();
            let pass = false;
            try {
                pass = JSON.parse(edustar_pass);
            } catch (e) {
                // Password was updated
            }
            if ((!pass.iv) && edustar_pass.trim()!==""){
                const [instance, created] = await Setting.findOrCreate({where:{ key: "edustar_pass" }});
                instance.value = JSON.stringify(await encrypt(edustar_pass, key));
                instance.save()
            }

            for (const setting of settings) {
                const [instance, created] = await Setting.findOrCreate({where:{ key: setting }});
                instance.value = changes[setting];
                instance.save()
            }
            res.json({});
        } catch (e) { err(e); }
    });
    route.get('/export', async (req, res, err) => {
        try {
            const settings = await Setting.findAll({raw:true});

            res.setHeader('Content-disposition', `attachment; filename=settings.json`);
            res.setHeader('Content-type', 'application/json');
            res.write(JSON.stringify(settings, null, 2), function (err) {
              res.end();
            });

        } catch (e) { err(e); }
    });
    const storage = multer.memoryStorage();
    const upload = multer({ storage });
    route.post('/import', upload.single('file'), async (req, res, err) => {
        try {
            const settings = JSON.parse(req.file.buffer.toString());
            for (const {key, value} of settings) {
                const [instance, created] = await Setting.findOrCreate({where: { key }});
                instance.value = value;
                instance.save()
            }
            res.json(settings);

        } catch (e) { err(e); }
    });

}