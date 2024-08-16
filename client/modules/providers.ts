import { ForwardRefExoticComponent, RefAttributes } from "react";
import { UseFormReturnType, hasLength, isNotEmpty } from "@mantine/form";
import { Icon, IconBinaryTree2, IconFolder, IconProps, IconSchool } from "@tabler/icons-react";
import { fileIcons, isAlphanumeric } from "./common";

import CSV from "../routes/Connectors/providers/CSV";
import LDAP, { LDAPContext } from "../routes/Connectors/providers/LDAP";
import FOLDER from "../routes/Connectors/providers/FOLDER";
import STMC, { STMCContext } from "../routes/Connectors/providers/STMC";

export interface ContextProps {
    form: UseFormReturnType<any>;
    rule: UseFormReturnType<Rule>;
    editing?: boolean;
    sources: string[];
    path?: string;
}

export interface provider {
    id: string;
    name: string;
    color?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    Options(props: { form: UseFormReturnType<Connector>, editing?: boolean }): JSX.Element;
    Context?(props: ContextProps): JSX.Element;
    initialValues?: Partial<Connector>;
    validate?: {[value: string]: (...v: unknown[]) => unknown};
}

export const providers: provider[] = [
    {
        id: 'csv',
        name: "Comma-Separated Values (CSV)",
        ...fileIcons.csv,
        Options: CSV,
        initialValues: {
            name: 'MyCSV',
        },
        validate: {
            name: isAlphanumeric('Name can only contain alphanumeric characters.'),
            path: hasLength({ min: 4 }, 'Path must be at least 4 characters long.'),
        },
    },
    {
        id: 'ldap',
        name: "Lightweight Directory Access Protocol (LDAP)",
        color: 'blue',
        Icon: IconBinaryTree2,
        Options: LDAP,
        Context: LDAPContext,
        initialValues: {
            name: 'MyLDAP',
        },
        validate: {
            name: isAlphanumeric('Name can only contain alphanumeric characters.'),
            url: hasLength({ min: 4 }, 'URL must be at least 4 characters long.'),
            username: isNotEmpty('Username can not be empty.'),
            password: isNotEmpty('Password can not be empty.'),
        },
    },
    {
        id: 'folder',
        name: "System Folder",
        color: 'lime',
        Icon: IconFolder,
        Options: FOLDER,
        initialValues: {
            name: 'MyFolder',
            type: 'file',
        },
        validate: {
            name: isNotEmpty('Name can not be empty.'),
            path: hasLength({ min: 2 }, 'Path must be at least 2 characters long.'),
        },
    },
    {
        id: 'stmc',
        name: "eduSTAR Management Centre (STMC)",
        color: 'yellow',
        Icon: IconSchool,
        Options: STMC,
        Context: STMCContext,
        initialValues: {
            name: 'MySchool',
            username: '',
            password: '',
            school: '',
            cache: 1440,
        },
        validate: {
            name: isNotEmpty('Name can not be empty.'),
            username: isNotEmpty('Name can not be empty.'),
            password: isNotEmpty('Name can not be empty.'),
            school: hasLength({ min: 4 }, 'School ID must be at least 4 characters long.'),
        },
    },

];
