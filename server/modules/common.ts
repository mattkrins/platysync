import { FastifyReply } from "fastify";
import winston from "winston";
//import { log } from "../server.js";
//import winston from "winston";

type status = 400|401|403|404|405|406|408|409|500|number;
export class xError {
    message: string;
    name: string = "Error";
    stack?: string|NodeJS.CallSite[];
    field?: string;
    status?: number;
    errors?: { [k: string]: string };
    /**
     * @param {string} message - Any stringifyable value.
     * @param {string} field - field name for validation.
     * @param {number} status - http response code:
     ** 400: Client Error
     ** 401: Unauthorized
     ** 403: Forbidden
     ** 404: Not Found
     ** 405: Method Not Allowed
     ** 406: Not Acceptable [ Default ]
     ** 408: Request Timeout
     ** 409: Conflict
     ** 500: Server Error
    **/
    constructor(message: unknown = "Unknown error.", field?: string|null, status?: status) {
      if (message instanceof xError){ this.message = message.message; return message; }
      if (typeof message === "string"){ this.message = message; } else {
        this.message = '[Unable to stringify the thrown value]';
        try {
            const stringified = JSON.stringify(message);
            if (stringified!=="{}") { this.message = stringified; } else {
                if ((message as {stack: string}).stack) this.message = (message as {stack: string}).stack;
            }
        } catch { /* empty */ }
      }
      if (Error.captureStackTrace) Error.captureStackTrace(this, xError);
      if (!this.stack) this.stack = (new Error()).stack;
      if (field) this.errors = { [field]: this.message };
      if (field) this.field = field;
      this.status = status;
      //if (log && log.verbose) log.verbose({...this, stack: this.stack });
    }
    public attach(error: xError|unknown = {}) {
      const e = (error as xError) || {};
      this.message = e.message;
      this.errors = e.errors;
      this.field = e.field;
      this.status = e.status;
      return this;
    }
    public send(reply: FastifyReply) {
      return reply.code(this.status||(this.errors?406:500)).send(this);
    }
}

export const wait = async (t = 1000) => new Promise((res)=>setTimeout(res, t));

export function validStr(string?: unknown) {
    if (!string) return false;
    if (typeof string !== "string") return false;
    if (string.trim()==="") return false;
    return true;
}

export const isNotEmpty = (error = "Can not be empty.") => (value: unknown) => validStr(value) ? false : error;
export const contains = (array: string[], error = "Does not contain.") => (value: unknown) => array.includes(value as string) ? false : error;

export function validate(values: { [k: string]: unknown }, validation: { [k: string]: (value: unknown) => unknown }) {
  for (const key of (Object.keys(validation))){
    if (validation[key](values[key])) throw new xError(validation[key](values[key]), key, 406);
  }
}

interface logOptions {
  rows?: number;
  limit?: number;
  start?: number;
  from?: Date;
  until?: Date;
  order?: string;
  fields: unknown;
}

export function getLogs(log: winston.Logger, options: logOptions) {
  return new Promise((resolve, reject)=>{
      try {
          log.query(options as winston.QueryOptions, function (e, { file }) {
              if (e) return reject(e);
              resolve(file);
          });
      } catch (e) { reject(e); }
  })
}