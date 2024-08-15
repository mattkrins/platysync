import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../actions.js";
import STMC from "../providers/STMC.js";

interface StmcUpStuPass {
    connector: string;
    dn: string;
    password: string;
}

export default async function StmcUpStuPass({ action, template, execute, data, connections, contexts }: props<StmcUpStuPass>) {
    try {
        data.connector = String(action.connector);
        data.dn = compile(template, action.dn);
        data.password = compile(template, action.password);
        if (!data.dn) throw new xError("DN not provided.");
        if (!data.connector) throw new xError("Connector not provided.");
        const ldap = connections[data.connector] as STMC|undefined;
        if (!ldap || !ldap.client) throw new xError(`Provider '${data.connector}' not connected.`);
        if (!execute) return { data };
        await ldap.client.setStudentPassword(data.dn, data.password);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
