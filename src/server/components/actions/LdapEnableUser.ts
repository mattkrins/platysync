import LdapDisableUser, { LdapDisableUserProps } from "./LdapDisableUser.js";

export default async function LdapEnableUser(props: LdapDisableUserProps) {
    return LdapDisableUser(props, true);
}