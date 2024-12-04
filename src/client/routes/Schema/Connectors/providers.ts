/* eslint-disable @typescript-eslint/no-explicit-any */
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { hasLength, isNotEmpty } from "@mantine/form";
import { Icon, IconBinaryTree2, IconCloudDown, IconFolder, IconProps, IconSchool } from "@tabler/icons-react";
import { fileIcons, isAlphanumeric } from "../../../modules/common";

import CSV from "./providers/CSV";
import LDAP, { LDAPContext } from "./providers/LDAP";
import FOLDER from "./providers/FOLDER";
import STMC, { STMCContext } from "./providers/STMC";
import API from "./providers/API";

export interface providerPropOptions {
    type?: any;
    placeholder?: string;
}

export interface providerProp {
    onChange: any;
    value?: any;
    defaultValue?: any;
    checked?: any;
    error?: any;
    scope?: string;
    onFocus?: any;
    onBlur?: any;
    placeholder?: string;
    styles?: object;
    leftSection?: JSX.Element;
    unlock?(): void;
    secure?: boolean;
}

export interface providerConfig {
    props: (name: string, options?: providerPropOptions) => providerProp;
    blueprint?: Action;
    rule?: Rule;
    scope?: string;
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
