/* eslint-disable @typescript-eslint/no-explicit-any */
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { Icon, IconArrowBarToRight, IconBinaryTree2, IconClock, IconCloudUp, IconCloudUpload, IconCopy, IconCsv, IconEqualNot, IconFile, IconFileTypePdf, IconFolder, IconFolderShare, IconLock, IconLockOpen, IconLockOpen2, IconLockPassword, IconMail, IconMailForward, IconPencil, IconPlus, IconPrinter, IconProps, IconSchool, IconShieldCog, IconTemplate, IconTerminal, IconTrash, IconUserPlus, IconUsersGroup } from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import DocWritePDF from "./operations/DocWritePDF";
import SysEncryptString from "./operations/SysEncryptString";
import SysDecryptString from "./operations/SysDecryptString";
import FileWriteTxt from "./operations/FileWriteTxt";
import LdapCreateUser from "./operations/LdapCreateUser";
import DocPrintPDF from "./operations/DocPrintPDF";
import FileCopy from "./operations/FileCopy";
import FileDelete from "./operations/FileDelete";
import FileMove from "./operations/FileMove";
import FolderCopy from "./operations/FolderCopy";
import FolderCreate from "./operations/FolderCreate";
import FolderDelete from "./operations/FolderDelete";
import FolderMove from "./operations/FolderMove";
import LdapUpdateAccount from "./operations/LdapUpdateAccount";
import LdapUpdateAttributes from "./operations/LdapUpdateAttributes";
import LdapUpdateGroups from "./operations/LdapUpdateGroups";
import LdapMoveOU from "./operations/LdapMoveOU";
import SysComparator from "./operations/SysComparator";
import StmcUpStuPass from "./operations/StmcUpStuPass";
import StmcUpStuPassBulk from "./operations/StmcUpStuPassBulk";
import SysRunCommand from "./operations/SysRunCommand";
import SysTemplate from "./operations/SysTemplate";
import SysWait from "./operations/SysWait";
import TransAPIRequest from "./operations/TransAPIRequest";
import FileWriteCSV from "./operations/FileWriteCSV";
import TransEmailSend from "./operations/TransEmailSend";

//TODO - thermal print, regular print, read file into template, write temp folder for rule, log to console, zip/unzip file/s
// https://github.com/thiagoelg/node-printer
// https://github.com/Klemen1337/node-thermal-printer

export interface operationPropOptions {
  type?: 'input' | 'checkbox'| 'password';
}

export interface operationProp {
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
  offLabel?: JSX.Element;
  onLabel?: JSX.Element;
  unlock?(): void;
  secure?: boolean;
}

export interface operationProps {
  props: (name: string, options?: operationPropOptions) => operationProp;
  form: UseFormReturnType<Rule>;
  path?: string;
  blueprint?: Action;
  rule?: Rule;
  scope?: string;
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
    scope?: string;
    Operation?(props: operationProps): JSX.Element;
    initialValues?: object;
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
        //provider: 'stmc',
        color: "yellow",
    },
];

export const availableOperations: operation[] = [
    {
        name: "DocPrintPDF",
        label: "Print PDF",
        category: 'document',
        Icon: IconPrinter,
        color: 'lime',
        validator: true,
        Operation: DocPrintPDF,
    },
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
    {
        name: "FileCopy",
        label: "Copy File",
        category: 'file',
        Icon: IconCopy,
        color: 'blue',
        validator: true,
        overwriter: true,
        Operation: FileCopy,
    },
    {
        name: "FileDelete",
        label: "Delete File",
        category: 'file',
        Icon: IconTrash,
        color: 'red',
        validator: true,
        Operation: FileDelete,
    },
    {
        name: "FileMove",
        label: "Move File",
        category: 'file',
        Icon: IconArrowBarToRight,
        color: 'orange',
        validator: true,
        overwriter: true,
        Operation: FileMove,
    },
    {
        name: "FileWriteCSV",
        label: "Write Results To CSV",
        category: 'file',
        Icon: IconCsv,
        color: 'green',
        Operation: FileWriteCSV,
        scope: "finalActions",
    },
    {
        name: "FileWriteTxt",
        label: "Write To File",
        category: 'file',
        Icon: IconPencil,
        color: 'lime',
        validator: true,
        overwriter: true,
        Operation: FileWriteTxt,
    },
    {
        name: "FolderCopy",
        label: "Copy Folder",
        category: 'folder',
        Icon: IconCopy,
        color: 'blue',
        validator: true,
        overwriter: true,
        Operation: FolderCopy,
    },
    {
        name: "FolderCreate",
        label: "Create Folder",
        category: 'folder',
        Icon: IconPlus,
        color: 'lime',
        overwriter: true,
        Operation: FolderCreate,
    },
    {
        name: "FolderDelete",
        label: "Delete Folder",
        category: 'folder',
        Icon: IconTrash,
        color: 'red',
        validator: true,
        Operation: FolderDelete,
    },
    {
        name: "FolderMove",
        label: "Move Folder",
        category: 'folder',
        Icon: IconArrowBarToRight,
        color: 'orange',
        validator: true,
        overwriter: true,
        Operation: FolderMove,
    },
    {
        name: "LdapEnableUser",
        label: "Enable User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconLockOpen,
        color: 'green',
    },
    {
        name: "LdapDisableUser",
        label: "Disable User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconLock,
        color: 'pink',
    },
    {
        name: "LdapDeleteUser",
        label: "Delete User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconTrash,
        color: 'red',
    },
    {
        name: "LdapCreateUser",
        label: "Create User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconUserPlus,
        color: 'blue',
        Operation: LdapCreateUser,
        initialValues: {
            attributes: [],
            groups: []
        },
    },
    {
        name: "LdapMoveOU",
        label: "Move Organisational Unit",
        category: 'directory',
        provider: 'ldap',
        Icon: IconFolderShare,
        color: 'grape',
        Operation: LdapMoveOU,
    },
    {
        name: "LdapUpdateAccount",
        label: "Update Account Controls",
        category: 'directory',
        provider: 'ldap',
        Icon: IconShieldCog,
        color: 'orange',
        Operation: LdapUpdateAccount,
    },
    {
        name: "LdapUpdateAttributes",
        label: "Update Attributes",
        category: 'directory',
        provider: 'ldap',
        Icon: IconPencil,
        color: 'orange',
        Operation: LdapUpdateAttributes,
        initialValues: {
            attributes: []
        },
    },  
    {
        name: "LdapUpdateGroups",
        label: "Update Groups",
        category: 'directory',
        provider: 'ldap',
        Icon: IconUsersGroup,
        color: 'yellow',
        Operation: LdapUpdateGroups,
        initialValues: {
            groups: []
        },
    },
    {
        name: "StmcUpStuPass",
        label: "Set Student Password",
        category: 'edustar',
        Icon: IconCloudUpload,
        color: 'yellow',
        //provider: 'stmc',
        Operation: StmcUpStuPass,
    },
    {
        name: "StmcUpStuPassBulk",
        label: "Upload Student Password CSV",
        category: 'edustar',
        Icon: IconCsv,
        color: 'orange',
        //provider: 'stmc',
        Operation: StmcUpStuPassBulk,
        validator: true,
    },
    {
        name: "SysComparator",
        label: "Comparator",
        category: 'system',
        Icon: IconEqualNot,
        Operation: SysComparator,
        initialValues: { conditions: [] },
    },
    {
        name: "SysDecryptString",
        label: "Decrypt String",
        category: 'system',
        Icon: IconLockOpen2,
        Operation: SysDecryptString,
    },
    {
        name: "SysEncryptString",
        label: "Encrypt String",
        category: 'system',
        Icon: IconLockPassword,
        Operation: SysEncryptString,
    },
    {
        name: "SysRunCommand",
        label: "Run Command",
        category: 'system',
        Icon: IconTerminal,
        Operation: SysRunCommand,
    },
    {
        name: "SysTemplate",
        label: "Template",
        category: 'system',
        Icon: IconTemplate,
        Operation: SysTemplate,
        initialValues: { templates: [] },
    },
    {
        name: "SysWait",
        label: "Wait",
        category: 'system',
        Icon: IconClock,
        Operation: SysWait,
    },
    {
        name: "TransAPIRequest",
        label: "API Request",
        category: 'transmission',
        Icon: IconCloudUp,
        color: 'red',
        Operation: TransAPIRequest,
        initialValues: {
            form: [],
            headers: [],
        }
    },
    {
        name: "TransEmailSend",
        label: "Send Email",
        category: 'transmission',
        Icon: IconMailForward,
        color: 'grape',
        Operation: TransEmailSend
    },
];