import { FastifyReply } from "fastify";
import { Schema } from "../typings/common.js";

type status = 400|401|403|404|405|406|408|409|500;
export class xError {
    message: string;
    name: string = "Error";
    stack?: string;
    field?: string;
    status?: number;
    validation?: { validation: { [k: string]: string } };
    /**
     * @param {string} message
     * @param {string} field
     * @param {number} status
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
          this.message = JSON.stringify(message);
        } catch { /* empty */ }
      }
      this.field = field;
      this.status = status;
      if (field) this.validation = { validation: { [field]: this.message } }
      if (Error.captureStackTrace) Error.captureStackTrace(this, xError);
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

function hasChild(haystack: string|undefined = "", needle: string){
    return String(haystack).includes(`{{`) && (String(haystack).includes(`.${needle}`) || String(haystack).includes(`/${needle}`));
}
function hasParent(haystack: string|undefined = "", needle: string){
    return String(haystack).includes(`{{`) && (String(haystack).includes(`${needle}.`) || String(haystack).includes(`${needle}/`));
}
export function findDependencies(schema: Schema, name: string, child = false, templatesOnly = true){
    const  hasHandle = child ? hasChild : hasParent;
    for (const connector of schema.connectors) {
        if (connector.path && hasHandle(connector.path, name)) return connector.name;
        if (templatesOnly) continue;
        if (connector.proxy && connector.proxy===name) return connector.name;
    }
    for (const rule of schema.rules) {
        if (hasHandle(rule.display, name)) return rule.name;
        for (const secondary of rule.secondaries||[]) {
            if (templatesOnly) continue;
            if (secondary.primary===name) return rule.name;
        }
        for (const condition of rule.conditions||[]) {
            if (hasHandle(condition.key, name)) return rule.name;
            if (hasHandle(condition.value, name)) return rule.name;
        }
        for (const action of rule.actions||[]) {
            if (hasHandle(action.value, name)) return rule.name;
            if (hasHandle(action.source, name)) return rule.name;
            if (hasHandle(action.target, name)) return rule.name;
            if (hasHandle(action.upn, name)) return rule.name;
            if (hasHandle(action.ou, name)) return rule.name;
            for (const attribute of action.attributes||[]) if (hasHandle(attribute.value, name)) return rule.name;
            for (const group of action.groups||[]) if (hasHandle(group as string, name)) return rule.name;
            for (const template of action.templates||[]) {
                if (hasHandle(template.name, name)) return rule.name;
                if (hasHandle(template.value, name)) return rule.name;
            }
        }
        if (templatesOnly) continue;
        if (rule.primary===name) return rule.name;
        if (rule.config && rule.config[name]) return rule.name;
        for (const config of Object.values(rule.config||{})) {
            for (const value of Object.values(config||{})) {
                if (String(value)===name) return rule.name;
            }
        }
    } return false;
}