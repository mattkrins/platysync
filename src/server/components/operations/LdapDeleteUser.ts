import { xError } from "../../modules/common.js";
import { LDAPOperation } from "../operation.js";
import { props } from "../operations.js";

export default class LdapDeleteUser extends LDAPOperation {
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        super.execute({ action, template, execute, data, ...rest });
        try {
            const user = await this.getUser({ action, template, execute, data, ...rest }, true);
            if (!user) return { warning: `User not found.`, data };
            if (!execute) return { data };
            await user.delete();
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}
