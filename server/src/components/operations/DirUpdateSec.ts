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

        return { success: true, data };
    } catch (e){
        return { error: String(e), data };
    }
}