import { xError } from "../../modules/common.js";
import { LDAPOperation } from "../operation.js";
import { props } from "../operations.js";

export default class LdapUpdateGroups extends LDAPOperation {
    ACCOUNTDISABLE: boolean = false;
    DONT_EXPIRE_PASSWD: boolean = false;
    SMARTCARD_REQUIRED: boolean = false;
    HOMEDIR_REQUIRED: boolean = false;
    PASSWORD_EXPIRED: boolean = false;
    DONT_REQUIRE_PREAUTH: boolean = false;
    TRUSTED_FOR_DELEGATION: boolean = false;
    TRUSTED_TO_AUTH_FOR_DELEGATION: boolean = false;
    userAccountControl!: string;
    flags!: string;
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        super.execute({ action, template, execute, data, ...rest });
        const flags: {[control: string]: boolean} = {
            ACCOUNTDISABLE: Boolean(action.ACCOUNTDISABLE),
            DONT_EXPIRE_PASSWD: Boolean(action.DONT_EXPIRE_PASSWD),
            SMARTCARD_REQUIRED: Boolean(action.SMARTCARD_REQUIRED),
            HOMEDIR_REQUIRED: Boolean(action.HOMEDIR_REQUIRED),
            PASSWORD_EXPIRED: Boolean(action.PASSWORD_EXPIRED),
            DONT_REQUIRE_PREAUTH: Boolean(action.DONT_REQUIRE_PREAUTH),
            TRUSTED_FOR_DELEGATION: Boolean(action.TRUSTED_FOR_DELEGATION),
            TRUSTED_TO_AUTH_FOR_DELEGATION: Boolean(action.TRUSTED_TO_AUTH_FOR_DELEGATION),
        };
        try {
            const user = await this.getUser({ action, template, execute, data, ...rest });
            data.userAccountControl = await user.setAccountControl(flags, true) as unknown as string;
            data.flags = flags as unknown as string;
            if (!execute) return { data };
            await user.setAccountControl(flags);
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}
