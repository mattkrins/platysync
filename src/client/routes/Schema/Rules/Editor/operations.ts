import { ForwardRefExoticComponent, RefAttributes } from "react";
import { Icon, IconBinaryTree2, IconFile, IconFileTypePdf, IconFolder, IconMail, IconProps, IconSchool, IconTerminal } from "@tabler/icons-react";
import DocWritePDF from "./operations/DocWritePDF";

export interface operationPropOptions {
  type?: 'input' | 'checkbox';
}

export interface operationProp {
  onChange: any;
  value?: any;
  defaultValue?: any;
  checked?: any;
  error?: any;
  onFocus?: any;
  onBlur?: any;
  placeholder?: string;
  styles?: object;
  leftSection?: JSX.Element;
  unlock?(): void;
  secure?: boolean;
}

export interface operationProps {
  props: (name: string, options?: operationPropOptions) => operationProp;
  blueprint?: Action;
  rule?: Rule;
}

export interface operation {
    name: string;
    label: string;
    category: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    color?: string;
    validator?: boolean;
    overwriter?: boolean;
    provider?: string;
    Operation?(props: operationProps): JSX.Element;
}

export interface operationCategory {
    id: string,
    name: string,
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    color?: string,
    provider?: string,
    iterativeOnly?: boolean,
}

export const availableCategories: operationCategory[] = [
    {
        name: "Directory Operations",
        id: 'directory',
        provider: 'ldap',
        Icon: IconBinaryTree2,
        color: "blue",
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
];

export const availableOperations: operation[] = [
    {
        name: "DocWritePDF",
        label: "Write PDF",
        category: 'document',
        Icon: IconFileTypePdf,
        color: 'red',
        validator: true,
        overwriter: true,
        Operation: DocWritePDF,
    },
];