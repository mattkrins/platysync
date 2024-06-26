import { ForwardRefExoticComponent, RefAttributes } from "react";
import { UseFormReturnType, hasLength, isNotEmpty } from "@mantine/form";
import { Icon, IconBinaryTree2, IconFileTypeCsv, IconProps } from "@tabler/icons-react";

import CSV from "../routes/Connectors/providers/CSV";
import { isAlphanumeric } from "./common";

export interface provider {
    id: string;
    name: string;
    color: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    Options(props: { form: UseFormReturnType<Record<string, unknown>>, editing?: boolean }): JSX.Element;
    initialValues?: Record<string, unknown>;
    validate?: {[value: string]: (...v: unknown[]) => unknown};
}

export const providers: provider[] = [
    {
        id: 'csv',
        name: "Comma-Separated Values (CSV)",
        color: 'teal',
        Icon: IconFileTypeCsv,
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
        Options: CSV,
    },
];
