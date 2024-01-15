import { FastifyReply, FastifyRequest } from "fastify";
import * as fs from 'fs';
import { _Error } from "../server.js";
import { AxiosFix } from "../typings/common.js";
import axios from 'axios';
import { default as ldap_ } from "../modules/ldap.js";
import { decrypt, Hash } from "../modules/cryptography.js";
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { LDAP, PROXY, STMC as STMC_provider } from "../typings/providers.js";
import { CSV, STMC } from "../components/providers.js";
const Axios = (axios as unknown as AxiosFix);

export type value = string|boolean;
export type formData = { [field: string]: value };

export async function validate(
    formData: formData,
    validators: { [field: string]: (value: value, body?: FastifyRequest) => Promise<string|false>|string|false },
    reply?: FastifyReply,
    body?: FastifyRequest,
    ): Promise<false | object> {
    const validation: { [field: string]: string|Promise<string|false> } = {};
    for (const field of Object.keys(validators)) {
        try {
            const error = await validators[field](formData[field], body);
            if (error) validation[field] = error;
        } catch (e){
            validation[field] = _Error(e).message;
        }
    }
    if (Object.keys(validation).length>0){
        if (reply) reply.code(400).send({ validation });
        return validation;
    }
    return false;
}

export function form(validation = {}){
    return {
        preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
            const form = request.body as Record<string, never>;
            await validate(form, validation, reply );
        }
    }
}

export function isNotEmpty(error: string = 'Cannot be empty.') {
    return (value?: value) => (!value || String(value).trim()==='') && error;
}

export function isPath(error: string = 'Path does not exist.') {
    return (value: value) => (!value || !(fs.existsSync(value as string))) && error;
}

export function isFile(error: string = 'Path is not a file.') {
    return (value: value) => (!value || !(fs.lstatSync(value as string).isFile())) && error;
}

export function isDirectory(error: string = 'Path is not a directory.') {
    return (value: value) => (!value || !(fs.lstatSync(value as string).isDirectory())) && error;
}

export function isPathValid() {
    return async (value: string|boolean) => {
        if (isNotEmpty('e')(value)) return 'File path can not be empty.';
        if (isPath('e')(value)) return 'Path does not exist.';
        if (isFile('e')(value)) return 'Path is not a file.';
        return false;
    }
}

export function hasLength(options: {min?: number, max?: number}, error: string = 'Does not meet requirements.') {
    return (value: value) => ( 
        (options.min?(String(value)).length<options.min:false) || 
        (options.max?(String(value)).length>options.max:false)  
    ) && error;
}

export function validWindowsFilename(error: string = 'Not a valid windows filename.') {
  const invalidChars = /[<>:"/\\|?*]/;
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  return (value: value) => {
    if (!value) return error;
    const filename = value as string;
    const valid = !invalidChars.test(filename) && !reservedNames.test(filename) && filename.length <= 260 && filename.length > 0;
    return !valid && error;
  }
}

export function validConnectorName(error: string = 'Connector name may only contain alphanumeric, - and _ characters.') {
    return (value: value) => {
        if (isNotEmpty('e')(value)) return 'Name can not be empty.';
        const validCharacters = /^[a-zA-Z0-9_-]*$/;
        const valid = validCharacters.test(value as string);
    return !valid && error;
  }
}

function isCSVPathValid() {
    return async (value: value) => {
        if (hasLength({ min: 2 }, 'e')(value)) return 'Path must be at least 2 characters long.';
        if (isPath('e')(value)) return 'Path does not exist.';
        if (isFile('e')(value)) return 'Path is not a file.';
        try {
            const csv = new CSV(value as string);
            await csv.open();
        } catch (e) { return String(e); }
        return false;
    }
}

function isValidPassword() {
    return async (value: value) => {
        if (typeof value === 'string' && isNotEmpty('e')(value)) return 'Password can not be empty.';
        if (typeof value === 'object'){
            if (!(value as Hash).encrypted) return 'Password malformed.';
            if (!(value as Hash).iv) return 'Password malformed.';
        }
        return false;
    }
}

function isLDAPUrlValid() {
    return async (value: value, request?: FastifyRequest  ) => {
        if (hasLength({ min: 3 }, 'e')(value)) return 'URL must be at least 3 characters long.';
        let client: ldap_;
        try {
            client = new ldap_();
            await client.connect(value as string);
        } catch (e) {
            const error = _Error(e);
            return `Failed to connect: ${error.message}`;
        }
        try {
            const body = request?.body as LDAP;
            const password = await decrypt(body.password as Hash);
            await client.login(body.username, password);
        } catch (e) {
            const error = _Error(e);
            return `Failed to login: ${error.message}`;
        } finally {
            client.close();
        }
        return false;
    }
}

function isProxyValid() {
    return async (value: value, request?: FastifyRequest  ) => {
        if (hasLength({ min: 3 }, 'e')(value)) return 'URL must be at least 3 characters long.';
        const url = new URL(value as string);
        const body = request?.body as PROXY;
        if (body.username) url.username = body.username;
        if (body.password) url.password = await decrypt(body.password as Hash);
        const options = {
            httpAgent: new HttpProxyAgent(url),
            httpsAgent: new HttpsProxyAgent(url),
            proxy: false as const,
        }
        try{
            const response = await Axios.default.get('https://www.example.com/', options);
            if (!response || !response.data) return "No data returned.";
            if (!response.data.includes("Example Domain")) return "Unexpected malformed data.";
        } catch (e) {
            const error = _Error(e);
            return `Failed to connect: ${error.message}`;
        }
        return false;
    }
}

function isSchoolValid() {
    return async (value: value, request?: FastifyRequest  ) => {
        if (isNotEmpty('e')(value)) return 'School ID can not be empty.';
        const { schema_name } = request?.params as { schema_name: string };
        const {school, proxy, ...body} = request?.body as STMC_provider;
        const stmc = new STMC(schema_name, school, proxy);
        const client = await stmc.configure();
        await client.validate();
        try {
            const password = await decrypt(body.password as Hash);
            await client.login(body.username, password);
        } catch (e) {
            const error = _Error(e);
            return `Failed to login: ${error.message}`;
        }
        return false;
    }
}

export const validators: {
    [id: string]: {
        [key: string]: (value: value, request?: FastifyRequest) => Promise<string|false>|string|false
    }
} = {
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
}
