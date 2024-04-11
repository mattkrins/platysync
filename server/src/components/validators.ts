import { FastifyReply, FastifyRequest } from "fastify";
import * as fs from 'fs';
import { xError } from "../modules/common.js";

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
            validation[field] = (new xError(e).message);
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
