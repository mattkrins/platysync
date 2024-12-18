import LdapDisableUser from "./LdapDisableUser.js";
import { props } from "../operations.js";

export default class LdapEnableUser extends LdapDisableUser {
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        return super.execute({ action, template, execute, data, ...rest }, true);
    }
}