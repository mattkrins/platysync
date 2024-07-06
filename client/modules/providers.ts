import { ForwardRefExoticComponent, RefAttributes } from "react";
import { UseFormReturnType, hasLength, isNotEmpty } from "@mantine/form";
import { Icon, IconBinaryTree2, IconProps } from "@tabler/icons-react";
import { fileIcons, isAlphanumeric } from "./common";

import CSV from "../routes/Connectors/providers/CSV";
import LDAP, { LDAPContext } from "../routes/Connectors/providers/LDAP";

export interface ContextProps {
    form: UseFormReturnType<any>;
    rule: UseFormReturnType<Rule>;
    editing?: boolean;
    sources: string[];
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
];
