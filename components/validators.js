import * as fs from 'fs';
import { _Error } from "../server.js";
import axios from 'axios';
import { default as ldap_ } from "../modules/ldap.js";
import { decrypt } from "../modules/cryptography.js";
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import eduSTAR from "../modules/eduSTAR.js";
import { getSchema } from "../routes/schema.js";
import { CSV } from "../components/providers.js";
const Axios = axios;
export async function validate(formData, validators, reply, body) {
    const validation = {};
    for (const field of Object.keys(validators)) {
        try {
            const error = await validators[field](formData[field], body);
            if (error)
                validation[field] = error;
        }
        catch (e) {
            validation[field] = _Error(e).message;
        }
    }
    if (reply && Object.keys(validation).length > 0)
        return reply.code(400).send({ validation });
    if (Object.keys(validation).length > 0)
        return validation;
}
export function form(validation = {}) {
    return {
        preHandler: async (request, reply) => {
            const form = request.body;
            await validate(form, validation, reply);
        }
    };
}
export function isNotEmpty(error = 'Cannot be empty.') {
    return (value) => (!value || String(value).trim() === '') && error;
}
export function isPath(error = 'Path does not exist.') {
    return (value) => (!value || !(fs.existsSync(value))) && error;
}
export function isFile(error = 'Path is not a file.') {
    return (value) => (!value || !(fs.lstatSync(value).isFile())) && error;
}
export function isDirectory(error = 'Path is not a directory.') {
    return (value) => (!value || !(fs.lstatSync(value).isDirectory())) && error;
}
export function isPathValid() {
    return async (value) => {
        if (isNotEmpty('e')(value))
            return 'File path can not be empty.';
        if (isPath('e')(value))
            return 'Path does not exist.';
        if (isFile('e')(value))
            return 'Path is not a file.';
        return false;
    };
}
export function hasLength(options, error = 'Does not meet requirements.') {
    return (value) => ((options.min ? (String(value)).length < options.min : false) ||
        (options.max ? (String(value)).length > options.max : false)) && error;
}
export function validWindowsFilename(error = 'Not a valid windows filename.') {
    const invalidChars = /[<>:"/\\|?*]/g;
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    return (value) => {
        if (!value)
            return error;
        const filename = value;
        const valid = !invalidChars.test(filename) && !reservedNames.test(filename) && filename.length <= 260 && filename.length > 0;
        return !valid && error;
    };
}
function isCSVPathValid() {
    return async (value) => {
        if (hasLength({ min: 2 }, 'e')(value))
            return 'Path must be at least 2 characters long.';
        if (isPath('e')(value))
            return 'Path does not exist.';
        if (isFile('e')(value))
            return 'Path is not a file.';
        try {
            const csv = new CSV(value);
            await csv.open();
        }
        catch (e) {
            return String(e);
        }
        return false;
    };
}
function isValidPassword() {
    return async (value) => {
        if (typeof value === 'string' && isNotEmpty('e')(value))
            return 'Password can not be empty.';
        if (typeof value === 'object') {
            if (!value.encrypted)
                return 'Password malformed.';
            if (!value.iv)
                return 'Password malformed.';
        }
        return false;
    };
}
function isLDAPUrlValid() {
    return async (value, request) => {
        if (hasLength({ min: 3 }, 'e')(value))
            return 'URL must be at least 3 characters long.';
        let client;
        try {
            client = new ldap_();
            await client.connect(value);
        }
        catch (e) {
            const error = _Error(e);
            return `Failed to connect: ${error.message}`;
        }
        try {
            const body = request?.body;
            const password = await decrypt(body.password);
            await client.login(body.username, password);
        }
        catch (e) {
            const error = _Error(e);
            return `Failed to login: ${error.message}`;
        }
        finally {
            client.close();
        }
        return false;
    };
}
function isProxyValid() {
    return async (value, request) => {
        if (hasLength({ min: 3 }, 'e')(value))
            return 'URL must be at least 3 characters long.';
        const url = new URL(value);
        const body = request?.body;
        if (body.username)
            url.username = body.username;
        if (body.password)
            url.password = await decrypt(body.password);
        const options = {
            httpAgent: new HttpProxyAgent(url),
            httpsAgent: new HttpsProxyAgent(url),
            proxy: false,
        };
        try {
            const response = await Axios.default.get('https://www.example.com/', options);
            if (!response || !response.data)
                return "No data returned.";
            if (!response.data.includes("Example Domain"))
                return "Unexpected malformed data.";
        }
        catch (e) {
            const error = _Error(e);
            return `Failed to connect: ${error.message}`;
        }
        return false;
    };
}
function isSchoolValid() {
    return async (value, request) => {
        if (isNotEmpty('e')(value))
            return 'School ID can not be empty.';
        const { schema_name } = request?.params;
        const { school, proxy, ...body } = request?.body;
        const schema = getSchema(schema_name);
        const options = {
            school,
        };
        if (proxy && String(proxy).trim() !== "") {
            if (!schema._connectors[proxy])
                return "Proxy connector does not exist.";
            const connector = schema._connectors[proxy];
            const url = new URL(connector.url);
            if (connector.username)
                url.username = connector.username;
            if (connector.password)
                url.password = await decrypt(connector.password);
            options.proxy = url;
        }
        const client = new eduSTAR(options);
        await client.validate();
        try {
            const password = await decrypt(body.password);
            await client.login(body.username, password);
        }
        catch (e) {
            const error = _Error(e);
            return `Failed to login: ${error.message}`;
        }
        return false;
    };
}
export const validators = {
    csv: {
        name: isNotEmpty('Name can not be empty.'),
        path: isCSVPathValid()
    },
    ldap: {
        name: isNotEmpty('Name can not be empty.'),
        url: isLDAPUrlValid(),
        username: isNotEmpty('Username can not be empty.'),
        password: isValidPassword()
    },
    proxy: {
        name: isNotEmpty('Name can not be empty.'),
        url: isProxyValid()
    },
    stmc: {
        name: isNotEmpty('Name can not be empty.'),
        username: isNotEmpty('Username can not be empty.'),
        password: isNotEmpty('Password can not be empty.'),
        school: isSchoolValid()
    },
};
