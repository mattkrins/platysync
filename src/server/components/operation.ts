import { xError } from "../modules/common.js";
import { encrypt } from "../modules/cryptography.js";
import { operationReturn, props } from "./operations.js";
import { User } from "../modules/ldap.js";
import LDAP from "./providers/LDAP.js";
import { compile } from "../modules/handlebars.js";


export default class Operation<type = object> {
    protected secrets: string[] = [ "password" ];
    protected id: string;
    protected name?: string;
    protected blueprint?: string;
    constructor(action: Action) {
        this.id = action.id;
        this.name = action.name;
        this.blueprint = action.blueprint;
    }
    public async post(action: Action): Promise<void> {
        for (const secret of this.secrets||[]) {
            if (action[secret] && typeof action[secret] === 'string' ) action[secret] = await encrypt(action[secret] as string);
        }
    }
    public async put(action: Action): Promise<void> {
        await this.post(action);
    }
    public async execute({ data }: props<type>): Promise<operationReturn<type>|void> {
        try {
            //
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}

export class LDAPOperation extends Operation {
    connector?: string;
    userFilter?: string;
    protected async getUser({ action, data, connections, template, id }: props<this>, strict = true): Promise<User> {
        if (!action.userFilter && !id) throw new xError("Search filter required.");
        data.connector = String(action.connector);
        if (data.userFilter) data.userFilter = compile(template, action.userFilter, `(&(objectclass=person)(sAMAccountName=${id}))`);
        if (!data.connector) throw new xError("Connector not provided.");
        const ldap = connections[data.connector] as LDAP|undefined;
        if (!ldap || !ldap.client) throw new xError(`Provider '${data.connector}' not connected.`);
        const user = await ldap.getUser(template, id, undefined, data.userFilter );
        if (strict && !user) throw new xError("User not found.");
        return user as User;
    }
}