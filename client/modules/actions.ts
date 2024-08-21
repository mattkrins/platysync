import { IconProps, Icon, IconUserPlus, IconFileTypePdf, IconPrinter, IconBinaryTree2, IconFile, IconFolder, IconMail, IconSchool, IconTerminal, IconFolderShare, IconLock, IconLockOpen, IconPencil, IconShieldCog, IconTrash, IconUsersGroup, IconArrowBarToRight, IconClock, IconCloudUp, IconCloudUpload, IconCopy, IconEqualNot, IconKey, IconMailForward, IconPlus, IconTemplate, IconCsv, IconCloudDownload } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { templateProps } from "../hooks/useTemplater";
import { UseFormReturnType, isNotEmpty } from "@mantine/form";
import DocWritePDF from "../routes/Rules/Editor/actions/DocWritePDF";
import DocPrintPDF from "../routes/Rules/Editor/actions/DocPrintPDF";
import FileCopy from "../routes/Rules/Editor/actions/FileCopy";
import FileDelete from "../routes/Rules/Editor/actions/FileDelete";
import FileMove from "../routes/Rules/Editor/actions/FileMove";
import FileWriteTxt from "../routes/Rules/Editor/actions/FileWriteTxt";
import FolderCopy from "../routes/Rules/Editor/actions/FolderCopy";
import FolderCreate from "../routes/Rules/Editor/actions/FolderCreate";
import FolderDelete from "../routes/Rules/Editor/actions/FolderDelete";
import FolderMove from "../routes/Rules/Editor/actions/FolderMove";
import SysComparator from "../routes/Rules/Editor/actions/SysComparator";
import SysEncryptString from "../routes/Rules/Editor/actions/SysEncryptString";
import SysRunCommand from "../routes/Rules/Editor/actions/SysRunCommand";
import SysTemplate from "../routes/Rules/Editor/actions/SysTemplate";
import SysWait from "../routes/Rules/Editor/actions/SysWait";
import TransEmailSend, { TransEmailSendConfig } from "../routes/Rules/Editor/actions/TransEmailSend";
import TransAPIRequest, { TransAPIRequestConfig } from "../routes/Rules/Editor/actions/TransAPIRequest";
import StmcUpStuPass from "../routes/Rules/Editor/actions/StmcUpStuPass";
import StmcUpStuPassBulk from "../routes/Rules/Editor/actions/StmcUpStuPassBulk";
import LdapCreateUser from "../routes/Rules/Editor/actions/LdapCreateUser";
import LdapUpdateAttributes from "../routes/Rules/Editor/actions/LdapUpdateAttributes";
import LdapUpdateGroups from "../routes/Rules/Editor/actions/LdapUpdateGroups";
import LdapUpdateAccount from "../routes/Rules/Editor/actions/LdapUpdateAccount";
import LdapMoveOU from "../routes/Rules/Editor/actions/LdapMoveOU";
import { ContextProps } from "./providers";
import { LDAPContext } from "../routes/Connectors/providers/LDAP";
import TransAPIGet from "../routes/Rules/Editor/actions/TransAPIGet";

export interface availableCategory {
    id: string,
    name: string,
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    color?: string,
    provider?: string,
    iterativeOnly?: boolean,
}

export const availableCategories: availableCategory[] = [
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
]

export interface actionProps {
    form: UseFormReturnType<Rule>;
    path: string;
    iterative?: boolean;
    templateProps: templateProps;
}

export interface actionConfigProps {
    form: UseFormReturnType<ActionConfig>;
    path?: string;
    name?: string;
    configProps: (name: string, rightSection?: boolean, leftSection?: boolean, placeholder?: string) => object
}

export interface availableAction {
    name: string;
    label?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    color?: string;
    category: string;
    Options?(props: actionProps): JSX.Element;
    initialValues?: Record<string, unknown>;
    validator?: boolean;
    overwriter?: boolean;
    provider?: string;
    iterative?: true|((props: ContextProps) => JSX.Element);
}

export const availableActions: availableAction[] = [
    //TODO - save results as csv
    {
        name: "LdapCreateUser",
        label: "Create User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconUserPlus,
        color: 'blue',
        Options: LdapCreateUser,
        iterative: LDAPContext,
        initialValues: {
            attributes: [],
            groups: []
        },
    },

    {
        name: "LdapEnableUser",
        label: "Enable User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconLockOpen,
        color: 'green',
        iterative: LDAPContext,
    },
    {
        name: "LdapDisableUser",
        label: "Disable User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconLock,
        color: 'pink',
        iterative: LDAPContext,
    },
    {
        name: "LdapDeleteUser",
        label: "Delete User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconTrash,
        color: 'red',
        iterative: LDAPContext,
    },
    {
        name: "LdapUpdateAttributes",
        label: "Update Attributes",
        category: 'directory',
        provider: 'ldap',
        Icon: IconPencil,
        color: 'orange',
        Options: LdapUpdateAttributes,
        iterative: LDAPContext,
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
        Options: LdapUpdateGroups,
        iterative: LDAPContext,
        initialValues: {
            groups: []
        },
    },
    {
        name: "LdapUpdateAccount",
        label: "Update Account Controls",
        category: 'directory',
        provider: 'ldap',
        Icon: IconShieldCog,
        color: 'orange',
        Options: LdapUpdateAccount,
        iterative: LDAPContext,
    },
    {
        name: "LdapMoveOU",
        label: "Move Organisational Unit",
        category: 'directory',
        provider: 'ldap',
        Icon: IconFolderShare,
        color: 'grape',
        Options: LdapMoveOU,
        iterative: LDAPContext,
    },
    {
        name: "DocWritePDF",
        label: "Write PDF",
        category: 'document',
        Icon: IconFileTypePdf,
        color: 'red',
        validator: true,
        overwriter: true,
        Options: DocWritePDF,
    },
    {
        name: "DocPrintPDF",
        label: "Print PDF",
        category: 'document',
        Icon: IconPrinter,
        color: 'lime',
        validator: true,
        Options: DocPrintPDF,
    },
    {
        name: "FileCopy",
        label: "Copy File",
        category: 'file',
        Icon: IconCopy,
        color: 'blue',
        validator: true,
        overwriter: true,
        Options: FileCopy,
    },
    {
        name: "FileDelete",
        label: "Delete File",
        category: 'file',
        Icon: IconTrash,
        color: 'red',
        validator: true,
        Options: FileDelete,
    },
    {
        name: "FileMove",
        label: "Move File",
        category: 'file',
        Icon: IconArrowBarToRight,
        color: 'orange',
        validator: true,
        overwriter: true,
        Options: FileMove,
    },
    {
        name: "FileWriteTxt",
        label: "Write To File",
        category: 'file',
        Icon: IconPencil,
        color: 'lime',
        validator: true,
        overwriter: true,
        Options: FileWriteTxt,
    },
    {
        name: "FolderCopy",
        label: "Copy Folder",
        category: 'folder',
        Icon: IconCopy,
        color: 'blue',
        validator: true,
        overwriter: true,
        Options: FolderCopy,
    },
    {
        name: "FolderCreate",
        label: "Create Folder",
        category: 'folder',
        Icon: IconPlus,
        color: 'lime',
        overwriter: true,
        Options: FolderCreate,
    },
    {
        name: "FolderDelete",
        label: "Delete Folder",
        category: 'folder',
        Icon: IconTrash,
        color: 'red',
        validator: true,
        Options: FolderDelete,
    },
    {
        name: "FolderMove",
        label: "Move Folder",
        category: 'folder',
        Icon: IconArrowBarToRight,
        color: 'orange',
        validator: true,
        overwriter: true,
        Options: FolderMove,
    },
    {
        name: "SysComparator",
        label: "Comparator",
        category: 'system',
        Icon: IconEqualNot,
        Options: SysComparator,
        initialValues: { conditions: [] },
    },
    {
        name: "SysEncryptString",
        label: "Encrypt String",
        category: 'system',
        Icon: IconKey,
        Options: SysEncryptString,
    },
    {
        name: "SysRunCommand",
        label: "Run Command",
        category: 'system',
        Icon: IconTerminal,
        Options: SysRunCommand,
    },
    {
        name: "SysTemplate",
        label: "Template",
        category: 'system',
        Icon: IconTemplate,
        Options: SysTemplate,
        initialValues: { templates: [] },
    },
    {
        name: "SysWait",
        label: "Wait",
        category: 'system',
        Icon: IconClock,
        Options: SysWait,
    },
    {
        name: "StmcUpStuPass",
        label: "Upload Student Password",
        category: 'edustar',
        Icon: IconCloudUpload,
        color: 'yellow',
        provider: 'stmc',
        Options: StmcUpStuPass,
    },
    {
        name: "StmcUpStuPassBulk",
        label: "Upload Student Password CSV",
        category: 'edustar',
        Icon: IconCsv,
        color: 'orange',
        provider: 'stmc',
        Options: StmcUpStuPassBulk,
        validator: true,
    },
    {
        name: "TransEmailSend",
        label: "Send Email",
        category: 'transmission',
        Icon: IconMailForward,
        color: 'grape',
        Options: TransEmailSend
    },
    {
        name: "TransAPIRequest",
        label: "API Request",
        category: 'transmission',
        Icon: IconCloudUp,
        color: 'red',
        Options: TransAPIRequest,
        initialValues: {
            method: 'get',
            mime: 'json',
            form: [],
        }
    },
    {
        name: "TransAPIGet",
        label: "API GET Request",
        category: 'transmission',
        Icon: IconCloudDownload,
        color: 'red',
        Options: TransAPIGet,
        initialValues: {
            method: 'get',
            mime: 'json'
        }
    },
]