import { xError } from "../../modules/common.js";
import LDAP from "../../modules/ldap.js";
import { LDAPOperation } from "../operation.js";
import { props } from "../operations.js";

export default class LdapUpdateGroups extends LDAPOperation {
    ou!: string;
    currentOu!: string;
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        await super.execute({ action, template, execute, data, ...rest });
        try {
            const user = await this.getUser({ action, template, execute, data, ...rest });
            data.currentOu = LDAP.ouFromDn(user.attributes.distinguishedName).toLowerCase();
            if (data.ou.toLowerCase() === data.currentOu) return { warn: `User already resides in target OU.`, data };
            if (!execute) return { data };
            await user.move(data.ou);
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}