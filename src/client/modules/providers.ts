import { ForwardRefExoticComponent, RefAttributes } from "react";
import { UseFormReturnType, hasLength, isNotEmpty } from "@mantine/form";
import { Icon, IconBinaryTree2, IconCloudDown, IconFolder, IconProps, IconSchool } from "@tabler/icons-react";
import { fileIcons, isAlphanumeric } from "./common";

import CSV from "../routes/Connectors/providers/CSV";
import LDAP, { LDAPContext } from "../routes/Connectors/providers/LDAP";
import FOLDER from "../routes/Connectors/providers/FOLDER";
import STMC, { STMCContext } from "../routes/Connectors/providers/STMC";
import API from "../routes/Connectors/providers/API";

export interface ContextProps {
    form: UseFormReturnType<any>;
    rule: UseFormReturnType<Rule>;
    editing?: boolean;
    sources: string[];
    path?: string;
}


export interface providerConfigOptions {
    type?: any;
    placeholder?: string;
}

export interface providerConfigProps {
    onChange: any;
    value?: any;
    defaultValue?: any;
    checked?: any;
    error?: any;
    onFocus?: any;
    onBlur?: any;
    placeholder?: string;
    unlock?(): void;
    secure?: boolean;
}

export interface providerConfig {
    props: (name: string, options?: providerConfigOptions) => providerConfigProps;
}

export interface contextConfig extends providerConfig {
    rule: Rule;
}

export interface provider {
    id: string;
    name: string;
    color?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    Options(props: providerConfig): JSX.Element;
    Context?(props: contextConfig): JSX.Element;
    initialValues?: Partial<Connector>;
    validate?: {[value: string]: (...v: unknown[]) => unknown};
}
export interface cProvider extends provider, Connector {
    pName: string;
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
    {
        id: 'api',
        name: "Web Request (API)",
        color: 'red',
        Icon: IconCloudDown,
        Options: API,
        initialValues: {
            name: 'MyAPI',
        },
        validate: {
            name: isNotEmpty('Name can not be empty.'),
            endpoint: isNotEmpty('Endpoint can not be empty.'),
        },
    },
];
