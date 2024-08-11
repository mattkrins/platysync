import { IconProps, Icon, IconUserPlus, IconFileTypePdf, IconPrinter, IconBinaryTree2, IconFile, IconFolder, IconMail, IconSchool, IconTerminal, IconFolderShare, IconLock, IconLockOpen, IconPencil, IconShieldCog, IconTrash, IconUsersGroup, IconArrowBarToRight, IconClock, IconCloudUp, IconCloudUpload, IconCopy, IconEqualNot, IconKey, IconMailForward, IconPlus, IconTemplate } from "@tabler/icons-react";
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
    iterative: boolean;
    templateProps: templateProps;
}

export interface actionConfigProps {
    form: UseFormReturnType<ActionConfig>;
}

export interface availableAction {
    name: string;
    label?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    color?: string;
    category: string;
    Options?(props: actionProps): JSX.Element;
    Config?(props: actionConfigProps): JSX.Element;
    initialValues?: Record<string, unknown>;
    initialConfig?: Record<string, unknown>;
    validator?: boolean;
    overwriter?: boolean;
    provider?: string;
    validate?: {[value: string]: (...v: unknown[]) => unknown};
}

export const availableActions: availableAction[] = [
    //TODO - save results as csv
    {
        name: "Create User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconUserPlus,
        color: 'blue',
    },

    {
        name: "Enable User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconLockOpen,
        color: 'green',
        // EnableUser,
    },
    {
        name: "Disable User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconLock,
        color: 'pink',
        // EnableUser,
    },
    {
        name: "Delete User",
        category: 'directory',
        provider: 'ldap',
        Icon: IconTrash,
        color: 'red',
        // EnableUser,
    },
    {
        name: "Update Attributes",
        category: 'directory',
        provider: 'ldap',
        Icon: IconPencil,
        color: 'orange',
        // UpdateAttributes,
        initialValues: {
            attributes: []
        },
    },  
    {
        name: "Update Groups",
        category: 'directory',
        provider: 'ldap',
        Icon: IconUsersGroup,
        color: 'yellow',
        // DirUpdateSec,
        initialValues: {
            groups: []
        },
    },
    {
        name: "Update Account Controls",
        category: 'directory',
        provider: 'ldap',
        Icon: IconShieldCog,
        color: 'orange',
        // DirAccountControl,
    },
    {
        name: "Move Organisational Unit",
        category: 'directory',
        provider: 'ldap',
        Icon: IconFolderShare,
        color: 'grape',
        // MoveOU,
    }, //TODO - everything above this ----------------------------------------------------------------------
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
        name: "StmcUpload",
        label: "Upload Student Passwords",
        category: 'edustar',
        Icon: IconCloudUpload,
        color: 'yellow',
        // Component: StmcUpload
    },
    {
        name: "TransEmailSend",
        label: "Send Email",
        category: 'transmission',
        Icon: IconMailForward,
        color: 'grape',
        Options: TransEmailSend,
        Config: TransEmailSendConfig,
        validate: {
            host: isNotEmpty('Host can not be empty.'),
            username: isNotEmpty('Username can not be empty.'),
            password: isNotEmpty('Password can not be empty.'),
        },
    },
    {
        name: "TransAPIRequest",
        label: "API Request",
        category: 'transmission',
        Icon: IconCloudUp,
        color: 'red',
        Options: TransAPIRequest,
        Config: TransAPIRequestConfig,
        initialValues: {
            method: 'get',
            mime: 'json',
            form: [],
        },
        initialConfig: {
            auth: 'none',
        },
        validate: {
            endpoint: isNotEmpty('Endpoint can not be empty.'),
        },
    },
]