import { IconProps, Icon, IconUserPlus, IconFileTypePdf, IconPrinter, IconBinaryTree2, IconFile, IconFolder, IconMail, IconSchool, IconTerminal } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export interface availableCategory {
    id: string,
    name: string,
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    color?: string,
    provider?: string,
    iterative?: boolean,
}

export const availableCategories: availableCategory[] = [
    {
        name: "Directory Operations",
        id: 'directory',
        provider: 'ldap',
        Icon: IconBinaryTree2,
        color: "blue",
        iterative: true,
    },
    {
        name: "eduSTAR Operations",
        id: 'edustar',
        Icon: IconSchool,
        provider: 'stmc',
        color: "yellow",
    },
    {
        name: "Document Operations",
        id: 'document',
        Icon: IconFileTypePdf,
        color: "red",
    },
    {
        name: "File Operations",
        id: 'file',
        Icon: IconFile,
        color: "green",
    },
    {
        name: "Folder Operations",
        id: 'folder',
        Icon: IconFolder,
        color: "orange",
    },
    {
        name: "System Operations",
        id: 'system',
        Icon: IconTerminal,
    },
    {
        name: "Transmission Operations",
        id: 'transmission',
        color: 'grape',
        Icon: IconMail,
    },
]

export interface availableAction {
    name: string;
    label?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    color?: string;
    category: string;
    //Options?(props: { form: UseFormReturnType<Rule>, templateProps?: templateProps, index: number, c: availableCondition }): JSX.Element;
    initialValues?: Record<string, unknown>;
    perRule?: boolean;
    requires?: string;
}

export const availableActions: availableAction[] = [
    {
        name: "Create User",
        category: 'directory',
        requires: 'ldap',
        Icon: IconUserPlus,
        color: 'blue',
    },
    {
        name: "Write PDF",
        category: 'document',
        Icon: IconFileTypePdf,
        color: 'red',
    },
    {
        name: "Send To Printer",
        category: 'document',
        Icon: IconPrinter,
        color: 'lime',
    },
]