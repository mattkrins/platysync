import { xError } from "../../modules/common.js";
import { LDAPOperation } from "../operation.js";
import { props } from "../operations.js";

export default class LdapDisableUser extends LDAPOperation {
    public async execute({ action, template, execute, data, ...rest }: props<this>, enable = false) {
        super.execute({ action, template, execute, data, ...rest });
        try {
            const user = await this.getUser({ action, template, execute, data, ...rest });
            if (enable && user.enabled()) return { warn: `User is already enabled.`, data };
            if (!enable && user.disabled()) return { warn: `User is already disabled.`, data };
            if (!execute) return { data };
            if (enable) await user.enable();
            if (!enable) await user.disable();
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}
