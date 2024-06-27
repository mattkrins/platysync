import { ForwardRefExoticComponent, RefAttributes } from "react";
import { UseFormReturnType, hasLength, isNotEmpty } from "@mantine/form";
import { Icon, IconBinaryTree2, IconFileTypeCsv, IconProps } from "@tabler/icons-react";

import CSV from "../routes/Connectors/providers/CSV";
import { fileIcons, isAlphanumeric } from "./common";

export interface provider {
    id: string;
    name: string;
    color?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    Options(props: { form: UseFormReturnType<Connector>, editing?: boolean }): JSX.Element;
    initialValues?: Partial<Connector>;
    validate?: {[value: string]: (...v: unknown[]) => unknown};
}

export const providers: provider[] = [
    {
        ...fileIcons.csv,
        id: 'csv',
        name: "Comma-Separated Values (CSV)",
        Options: CSV,
        initialValues: {
            name: 'MyCSV',
        },
        validate: {
            name: isAlphanumeric('Name can only contain alphanumeric characters.'),
            path: hasLength({ min: 4 }, 'Path must be at least 4 characters long.'),
        },
    },
    //{
    //    id: 'ldap',
    //    name: "Lightweight Directory Access Protocol (LDAP)",
    //    color: 'blue',
    //    Icon: IconBinaryTree2,
    //    Options: CSV,
    //},
];
