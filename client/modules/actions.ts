import { IconProps, Icon, IconUserPlus, IconFileTypePdf, IconPrinter, IconBinaryTree2, IconFile, IconFolder, IconMail, IconSchool, IconTerminal, IconFolderShare, IconLock, IconLockOpen, IconPencil, IconShieldCog, IconTrash, IconUsersGroup, IconArrowBarToRight, IconClock, IconCloudUp, IconCloudUpload, IconCopy, IconEqualNot, IconKey, IconMailForward, IconPlus, IconTemplate } from "@tabler/icons-react";
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
        name: "Enable User",
        category: 'directory',
        requires: 'ldap',
        Icon: IconLockOpen,
        color: 'green',
        // EnableUser,
    },
    {
        name: "Disable User",
        category: 'directory',
        requires: 'ldap',
        Icon: IconLock,
        color: 'pink',
        // EnableUser,
    },
    {
        name: "Delete User",
        category: 'directory',
        requires: 'ldap',
        Icon: IconTrash,
        color: 'red',
        // EnableUser,
    },
    {
        name: "Update Attributes",
        category: 'directory',
        requires: 'ldap',
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
        requires: 'ldap',
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
        requires: 'ldap',
        Icon: IconShieldCog,
        color: 'orange',
        // DirAccountControl,
    },
    {
        name: "Move Organisational Unit",
        category: 'directory',
        requires: 'ldap',
        Icon: IconFolderShare,
        color: 'grape',
        // MoveOU,
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
    {
        name: "Copy File",
        category: 'file',
        Icon: IconCopy,
        color: 'blue',
        // // Component: CopyFile,
    },
    {
        name: "Move File",
        category: 'file',
        Icon: IconArrowBarToRight,
        color: 'orange',
        // Component: MoveFile,
    },
    {
        name: "Delete File",
        category: 'file',
        Icon: IconTrash,
        color: 'red',
        // Component: DeleteFile,
    },
    {
        name: "Write To File",
        category: 'file',
        Icon: IconPencil,
        color: 'lime',
        // Component: FileWriteTxt,
    },
    {
        name: "Copy Folder",
        category: 'folder',
        Icon: IconCopy,
        color: 'blue',
        // Component: CopyFolder,
    },
    {
        name: "Move Folder",
        category: 'folder',
        Icon: IconArrowBarToRight,
        color: 'orange',
        // Component: MoveFolder,
    },
    {
        name: "Delete Folder",
        category: 'folder',
        Icon: IconTrash,
        color: 'red',
        // Component: DeleteFolder,
    },
    {
        name: "Create Folder",
        category: 'folder',
        Icon: IconPlus,
        color: 'lime',
        // Component: FolderCreate,
    },
    {
        name: "Template",
        label: "Build Data Template",
        category: 'system',
        Icon: IconTemplate,
        // Component: Template,
        initialValues: {
            templates: []
        },
    },
    {
        name: "Encrypt String",
        category: 'system',
        Icon: IconKey,
        // Component: EncryptString,
    },
    {
        name: "Comparator",
        category: 'system',
        Icon: IconEqualNot,
        // Component: SysComparator,
        initialValues: {
            conditions: []
        },
    },
    {
        name: "Wait",
        category: 'system',
        Icon: IconClock,
        // Component: SysWait,
    },
    {
        name: "Run Command",
        category: 'system',
        Icon: IconTerminal,
        // Component: RunCommand,
    },
    {
        name: "Upload Student Passwords",
        category: 'edustar',
        Icon: IconCloudUpload,
        color: 'yellow',
        // Component: StmcUpload
    },
    {
        name: "Send Email",
        category: 'transmission',
        Icon: IconMailForward,
        color: 'grape',
        // Component: TransEmailSend
    },
    {
        name: "API Request",
        category: 'transmission',
        Icon: IconCloudUp,
        color: 'red',
        // Component: TransAPISend,
        initialValues: {
            method: 'get',
            mime: 'json',
            form: []
        },
    },
]