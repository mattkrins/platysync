export const commonAttributes = [
    "userPrincipalName",
    "name",
    "displayName",
    "givenName",
    "SN",
    "description",
    "title",
    "mail",
    "company",
    "department",
    "manager",
    "postalCode",
    "pager",
    "mobile",
    "homephone",
    "telephoneNumber",
    "facsimileTelephoneNumber",
    "wWWHomePage",
    "ipPhone",
].map(att => { return {key: att, text: att, value: att } });

export const actions = {
    "create" : { name: "Create", icon: "user", color: "blue" },
    "enable" : { name: "Enable", icon: "unlock", color: "green" },
    "disable" : { name: "Disable", icon: "lock", color: "grey" },
    "update" : { name: "Update", icon: "edit", color: "orange" },
    "move" : { name: "Move", icon: "sign in alternate", color: "purple" },
    "delete" : { name: "Delete", icon: "trash alternate", color: "red" },
    "print" : { name: "Print", icon: "print", color: "black" }
}

export const trimString = (s="",l=15) => s.length > l ? s.substring(0, l) + "..." : s;
