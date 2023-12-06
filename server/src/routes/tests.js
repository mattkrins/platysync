import { Schema } from "../../db/models.js";
import { connect, login } from '../modules/ldap.js';
import eduSTAR from '../modules/eduSTAR.js';
import { decrypt, getKey } from '../modules/cryptography.js';
import { loadCSV } from '../modules/common.js';
import axios from 'axios';

export default function ( route ) {
    route.post('/test/ldap', async (req, res, err) => {
        try {
            await connect(req.body.ldap_uri, true);
            res.json({ ldap_uri: true });
        } catch (e) {
            e.errors = [ { path: "ldap_uri", message: e.message } ]
            err(e);
        }
    });

    route.post('/test/login', async (req, res, err) => {
        try {
            const editedSchema = req.body;
            const schema = await Schema.findOne({ where: { name: editedSchema.name } });
            if (schema.ldap_pass === editedSchema.ldap_pass) {
                const key = await getKey();
                editedSchema.ldap_pass = await decrypt(schema.ldap_pass, key);
            }
            await login(editedSchema.ldap_uri, editedSchema.ldap_user, editedSchema.ldap_pass, true);
            res.json({ credentials: true });
        } catch (e) {
            e.errors = [ { path: "credentials", message: e.message } ]
            err(e);
        }
    });

    route.post('/test/csv', async (req, res, err) => {
        try {
            const parsed = await loadCSV(req.body.csv_path);
            res.json({ csv_path: parsed });
        } catch (e) {
            e.errors = [ { path: "csv_path", message: e.message } ]
            err(e);
        }
    });

    route.post('/test/proxy', async (req, res, err) => {
        try {
            const url = new URL(req.body.proxy);
            const axiosClient = axios.create({  proxy: {
              protocol: url.protocol.split(":")[0],
              host: url.hostname,
              port: url.port
            },});
            axiosClient.get('http://google.com').then((response)=>{
                if (!response || !response.data) throw Error("No response");
                res.json({ proxy: true });
            }).catch(function (error) {
                error.errors = [ { path: "proxy", message: error.message } ]
                err(error);
            })
        } catch (e) {
            e.errors = [ { path: "proxy", message: e.message } ]
            err(e);
        }
    });

    route.post('/test/edustar', async (req, res, err) => {
        try {
            const {proxy, edustar_user: username, edustar_pass: password, school_id: schoolID, cache_policy: cachePolicy} = req.body;
            const client = new eduSTAR({
                proxy,
                username,
                password,
                schoolID,
                cachePolicy
            });
            await client.init();
            await client.login();
            res.json({ credentials: true });
        } catch (e) {
            e.errors = [ { path: "credentials", message: e.message } ]
            err(e);
        }
    });
}