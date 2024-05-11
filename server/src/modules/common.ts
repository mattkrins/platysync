import { FastifyReply } from "fastify";
import { log } from "../server.js";
import winston from "winston";

type status = 400|401|403|404|405|406|408|409|500|number;
export class xError {
    message: string;
    name: string = "Error";
    stack?: string;
    field?: string;
    status?: number;
    validation?: { validation: { [k: string]: string } };
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
    constructor(message: unknown = "Unknown error.", field?: string, status?: status) {
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
      log.silly(this.message);
      this.field = field;
      this.status = status;
      if (field) this.validation = { validation: { [field]: this.message } }
      if (Error.captureStackTrace) Error.captureStackTrace(this, xError);
    }
    public attach(error: xError|unknown = {}) {
      const e = (error as xError) || {};
      this.message = e.message;
      this.validation = e.validation;
      this.field = e.field;
      this.status = e.status;
      return this;
    }
    public send(reply: FastifyReply) {
      return reply.code(this.status||(this.validation?406:500)).send(this.validation||{ error: this.message });
    }
}

export function validStr(string: string) {
    if (!string) return false;
    if (typeof string !== "string") return false;
    if (string.trim()==="") return false;
    return true;
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