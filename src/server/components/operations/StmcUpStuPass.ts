import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import Operation from "../operation.js";
import { props } from "../operations.js";
import STMC from "../providers/STMC.js";

export default class StmcUpStuPass extends Operation {
    connector!: string;
    dn!: string;
    password!: string;
    public async execute({ action, template, execute, data, connections, ...rest }: props<this>) {
        super.execute({ action, template, execute, data, connections, ...rest });
        try {
            data.connector = String(action.connector);
            data.dn = compile(template, action.dn);
            data.password = compile(template, action.password);
            if (!data.dn) throw new xError("DN not provided.");
            if (!data.connector) throw new xError("Connector not provided.");
            const stmc = connections[data.connector] as STMC|undefined;
            if (!stmc || !stmc.client) throw new xError(`Provider '${data.connector}' not connected.`);
            if (!execute) return { data };
            await stmc.client.setStudentPassword(data.dn, data.password);
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}