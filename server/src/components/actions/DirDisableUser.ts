import { Action, result, template } from '../../typings/common.js'
import { connections } from "../rules.js";
import enableUser from './DirEnableUser.js'
export default async function disableUser(execute = false, act: Action, template: template, connections: connections): Promise <result> {
    return enableUser(execute, act, template, connections, undefined, false, true);
}