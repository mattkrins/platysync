import { IconArrowBarToRight, IconBinaryTree2, IconCalendar, IconCirclesRelation, IconClock, IconCloudUpload, IconCopy, IconEqualNot, IconFile, IconFileText, IconFileTypeCsv, IconFileTypeDocx, IconFileTypeXls, IconFileZip, IconFolder, IconFolderShare, IconKey, IconLock, IconLockOpen, IconMail, IconMathFunction, IconPencil, IconPhoto, IconPlus, IconSchool, IconShieldCog, IconTemplate, IconTerminal, IconTrash, IconUserQuestion, IconUsersGroup, TablerIconsProps } from '@tabler/icons-react';
import { IconUserPlus, IconFileTypePdf, IconPrinter } from '@tabler/icons-react';
import EnableUser from '../components/Rules/Editor/Operations/DirEnableUser';
import CreateUser from '../components/Rules/Editor/Operations/DirCreateUser';
import UpdateAttributes from '../components/Rules/Editor/Operations/DirUpdateAtt';
import MoveOU from '../components/Rules/Editor/Operations/DirMoveOU';
import WritePDF from '../components/Rules/Editor/Operations/DocWritePDF';
import Print from '../components/Rules/Editor/Operations/DocPrint';
import CopyFile from '../components/Rules/Editor/Operations/FileCopy';
import MoveFile from '../components/Rules/Editor/Operations/FileMove';
import DeleteFile from '../components/Rules/Editor/Operations/FileDelete';
import CopyFolder from '../components/Rules/Editor/Operations/FolderCopy';
import MoveFolder from '../components/Rules/Editor/Operations/FolderMove';
import DeleteFolder from '../components/Rules/Editor/Operations/FolderDelete';
import Template from '../components/Rules/Editor/Operations/SysTemplate';
import FileWriteTxt from '../components/Rules/Editor/Operations/FileWriteTxt';
import StmcUpload from '../components/Rules/Editor/Operations/StmcUpload';
import EncryptString from '../components/Rules/Editor/Operations/SysEncryptString';
import FolderCreate from '../components/Rules/Editor/Operations/FolderCreate';
import DirUpdateSec from '../components/Rules/Editor/Operations/DirUpdateSec';
import SysComparator from '../components/Rules/Editor/Operations/SysComparator';
import DirAccountControl from '../components/Rules/Editor/Operations/DirAccountControl';
import RunCommand from '../components/Rules/Editor/Operations/SysRunCommand';
import EmailSend from '../components/Rules/Editor/Operations/EmailSend';
import { IconMailForward } from '@tabler/icons-react';
import SysWait from '../components/Rules/Editor/Operations/SysWait';

export const ldapAttributes = [
    "name",
    "displayName",
    "givenName",
    "SN",
    "description",
    "title",
    "mail",
    "company",
    "department",
    "manager",
    "postalCode",
    "pager",
    "mobile",
    "homephone",
    "telephoneNumber",
    "facsimileTelephoneNumber",
    "wWWHomePage",
    "ipPhone",
]

export const stringOperators = [
    { label: '== Equal To', value: '==' },
    { label: '!= Not Equal To', value: '!=' },
    { label: '>< Contains', value: '><' },
    { label: '<> Does Not Contain', value: '<>' },
    { label: '>* Starts With', value: '>*' },
    { label: '*< Ends With', value: '*<' },
    { label: '// Matches Regex', value: '//' },
]

export const mathOperators = [
    { label: '== Equal To', value: '===' },
    { label: '!= Not Equal To', value: '!==' },
    { label: '>  Greater Than', value: '>' },
    { label: '<  Lesser Than', value: '<' },
    { label: '>= Greater Than, Or Equal To', value: '>=' },
    { label: '<= Lesser Than, Or Equal To', value: '<=' },
]

export const dateOperators = [
    { label: '== Equal To', value: 'date.==' },
    { label: '!= Not Equal To', value: 'date.!=' },
    { label: 'After', value: 'date.>' },
    { label: 'Before', value: 'date.<' },
]

export const availableConditions: {
    label: string,
    id: string,
    connector?: string,
    Icon: (props: TablerIconsProps) => JSX.Element,
    color: string,
}[] = [
    {
        label: "String Constraint",
        id: 'string',
        Icon: IconCirclesRelation,
        color: "blue",
    },
    {
        label: "Math Constraint",
        id: 'math',
        Icon: IconMathFunction,
        color: "pink",
    },
    {
        label: "File Constraint",
        id: 'file',
        Icon: IconFile,
        color: "lime",
    },
    {
        label: "Date Constraint",
        id: 'date',
        Icon: IconCalendar,
        color: "red",
    },
    {
        label: "Status",
        id: 'status',
        connector: 'ldap',
        Icon: IconUserQuestion,
        color: "yellow",
    },
    {
        label: "Security Group",
        id: 'group',
        connector: 'ldap',
        Icon: IconUsersGroup,
        color: "cyan",
    },
    {
        label: "Organisational Unit",
        id: 'ou',
        connector: 'ldap',
        Icon: IconFolder,
        color: "violet",
    },
]

export const availableCatagories: {
        id: string,
        label: string,
        Icon: (props: TablerIconsProps) => JSX.Element,
        color?: string,
        requires?: string[],
        perRule?: boolean,
}[] = [
    {
        label: "Directory Operations",
        id: 'directory',
        requires: ['ldap'],
        Icon: IconBinaryTree2,
        color: "blue",
        perRule: true,
    },
    {
        label: "eduSTAR Operations",
        id: 'edustar',
        Icon: IconSchool,
        requires: ['stmc'],
        color: "yellow",
    },
    {
        label: "Document Operations",
        id: 'document',
        Icon: IconFileTypePdf,
        color: "red",
    },
    {
        label: "File Operations",
        id: 'file',
        Icon: IconFile,
        color: "green",
    },
    {
        label: "Folder Operations",
        id: 'folder',
        Icon: IconFolder,
        color: "orange",
    },
    {
        label: "System Operations",
        id: 'system',
        Icon: IconTerminal,
    },
    {
        label: "Email Operations",
        id: 'email',
        color: 'grape',
        Icon: IconMail,
    },
]

export const availableActions: {
    id: string;
    label?: string;
    Icon: (props: TablerIconsProps) => JSX.Element;
    color?: string;
    catagory: string;
    Component: (props: ActionItem) => JSX.Element;
    perRule?: boolean;
    requires?: string;
}[] = [
    {
        id: "Create User",
        catagory: 'directory',
        requires: 'ldap',
        Icon: IconUserPlus,
        color: 'blue',
        Component: CreateUser,
    },
    {
        id: "Enable User",
        catagory: 'directory',
        requires: 'ldap',
        Icon: IconLockOpen,
        color: 'green',
        Component: EnableUser,
    },
    {
        id: "Disable User",
        catagory: 'directory',
        requires: 'ldap',
        Icon: IconLock,
        color: 'pink',
        Component: EnableUser,
    },
    {
        id: "Delete User",
        catagory: 'directory',
        requires: 'ldap',
        Icon: IconTrash,
        color: 'red',
        Component: EnableUser,
    },
    {
        id: "Update Attributes",
        catagory: 'directory',
        requires: 'ldap',
        Icon: IconPencil,
        color: 'orange',
        Component: UpdateAttributes,
    },
    {
        id: "Update Groups",
        catagory: 'directory',
        requires: 'ldap',
        Icon: IconUsersGroup,
        color: 'yellow',
        Component: DirUpdateSec,
    },
    {
        id: "Update Account Controls",
        catagory: 'directory',
        requires: 'ldap',
        Icon: IconShieldCog,
        color: 'orange',
        Component: DirAccountControl,
    },
    {
        id: "Move Organisational Unit",
        catagory: 'directory',
        requires: 'ldap',
        Icon: IconFolderShare,
        color: 'grape',
        Component: MoveOU,
    },
    {
        id: "Write PDF",
        catagory: 'document',
        Icon: IconFileTypePdf,
        color: 'red',
        Component: WritePDF,
    },
    {
        id: "Send To Printer",
        catagory: 'document',
        Icon: IconPrinter,
        color: 'lime',
        Component: Print,
    },
    {
        id: "Copy File",
        catagory: 'file',
        Icon: IconCopy,
        color: 'blue',
        Component: CopyFile,
    },
    {
        id: "Move File",
        catagory: 'file',
        Icon: IconArrowBarToRight,
        color: 'orange',
        Component: MoveFile,
    },
    {
        id: "Delete File",
        catagory: 'file',
        Icon: IconTrash,
        color: 'red',
        Component: DeleteFile,
    },
    {
        id: "Write To File",
        catagory: 'file',
        Icon: IconPencil,
        color: 'lime',
        Component: FileWriteTxt,
    },
    {
        id: "Copy Folder",
        catagory: 'folder',
        Icon: IconCopy,
        color: 'blue',
        Component: CopyFolder,
    },
    {
        id: "Move Folder",
        catagory: 'folder',
        Icon: IconArrowBarToRight,
        color: 'orange',
        Component: MoveFolder,
    },
    {
        id: "Delete Folder",
        catagory: 'folder',
        Icon: IconTrash,
        color: 'red',
        Component: DeleteFolder,
    },
    {
        id: "Create Folder",
        catagory: 'folder',
        Icon: IconPlus,
        color: 'lime',
        Component: FolderCreate,
    },
    {
        id: "Template",
        label: "Build Data Template",
        catagory: 'system',
        Icon: IconTemplate,
        Component: Template,
    },
    {
        id: "Encrypt String",
        catagory: 'system',
        Icon: IconKey,
        Component: EncryptString,
    },
    {
        id: "Comparator",
        catagory: 'system',
        Icon: IconEqualNot,
        Component: SysComparator,
    },
    {
        id: "Wait",
        catagory: 'system',
        Icon: IconClock,
        Component: SysWait,
    },
    {
        id: "Run Command",
        catagory: 'system',
        Icon: IconTerminal,
        Component: RunCommand,
    },
    {
        id: "Upload Student Passwords",
        catagory: 'edustar',
        Icon: IconCloudUpload,
        color: 'yellow',
        Component: StmcUpload
    },
    {
        id: "Send Email",
        catagory: 'email',
        Icon: IconMailForward,
        color: 'grape',
        Component: EmailSend
    },
]

export const extIcons: { [k: string]: (props: TablerIconsProps) => JSX.Element } = {
    jpg: IconPhoto,
    jpeg: IconPhoto,
    png: IconPhoto,
    gif: IconPhoto,
    svg: IconPhoto,
    bmp: IconPhoto,
    pdf: IconFileTypePdf,
    doc: IconFileTypeDocx,
    docx: IconFileTypeDocx,
    xls: IconFileTypeXls,
    xlsx: IconFileTypeXls,
    txt: IconFileText,
    csv: IconFileTypeCsv,
    json: IconFileText,
    xml: IconFileText,
    zip: IconFileZip,
    rar: IconFileZip,
    tar: IconFileZip,
    gz: IconFileZip,
    dmg: IconFileZip,
};
