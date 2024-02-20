import { Action } from "../../typings/common.js";
import { actionProps, connect } from "../engine.js";
import ldap, { User } from "../../modules/ldap.js";

interface Group {
    type: 'Add'|'Delete';
    value: string;
}

interface update extends Group {
    success?: true;
    error?: string;
}

interface props extends actionProps {
    action: Action & {
        target: string;
        upn: string;
        groups: Group[];
        clean: boolean;
    }
}

export default async function ({ action, template, execute, data, connections, schema }: props) {
    try {
        await connect(schema, action.target, connections);
        const client = connections[action.target].client as ldap;
        if (!client) return {error: 'LDAP client not found.', data};
        //data.upn = compile(template, action.upn);
        const found = await client.searchUser('userPrincipalName', data.upn, ['distinguishedName', 'memberOf'] );
        

        return { success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}