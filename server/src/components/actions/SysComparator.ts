import { Action, template, result, Condition } from '../../typings/common.js'
import { connections } from "../rules.js";
import Handlebars from "../../modules/handlebars.js";
import { matchedAllConditions } from '../rules.js';

interface SysComparator extends Action  {
    conditions: Condition[];
    target: string;
    output: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function sysComparator(
    execute = false,
    act: Action,
    template: template,
    connections: connections,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fileHandles?: {[handle: string]: any},
    close?: boolean,
    id?: string,
    disable = false
    ): Promise <result> {
    const action = act as SysComparator;
    const data: {[k: string]: string} = {};
    try {
        const matched = !await matchedAllConditions(action.conditions, template, connections, id||'' );
        const newTemplate: { [k:string]: string } = {};
        const output = action.output ? Handlebars.compile(action.target)(template) : false;
        if (!matched) {
            if (output===false) return { success: true, data};
            newTemplate[output] = 'true';
        } else {
            if (output===false) return {error: 'Did not meet conditions.', data};
            newTemplate[output] = 'false';
        }
        return {template: true, data: newTemplate};
    } catch (e){
        return {error: String(e)};
    }
}
