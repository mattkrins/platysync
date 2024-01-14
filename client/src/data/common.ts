import { IconArrowBarToRight, IconBinaryTree2, IconCirclesRelation, IconCopy, IconFile, IconFolder, IconFolderShare, IconLock, IconLockOpen, IconMathFunction, IconPencil, IconTemplate, IconTerminal, IconTrash, IconUserQuestion, IconUsersGroup, TablerIconsProps } from '@tabler/icons-react';
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

type catagory = 'directory'|'document'|'edustar'|'system'|'file'|'folder';
export const availableCatagories: {
        id: catagory,
        label: string,
        Icon: (props: TablerIconsProps) => JSX.Element,
        color?: string,
}[] = [
    {
        label: "Directory Operations",
        id: 'directory',
        Icon: IconBinaryTree2,
        color: "blue",
    },
    //TODO - eduSTAR Operations
    //{
    //    label: "eduSTAR Operations",
    //    id: 'edustar',
    //    Icon: IconSchool,
    //    color: "yellow",
    //},
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
]

export const availableActions: {
    [key: string]: {
        id: string;
        label?: string;
        Icon: (props: TablerIconsProps) => JSX.Element;
        color?: string;
        catagory: catagory;
        Component: (props: ActionItem) => JSX.Element;
        perRule?: false;
    }
} = {
    "Create User": {
        id: "Create User",
        catagory: 'directory',
        Icon: IconUserPlus,
        color: 'blue',
        Component: CreateUser,
    },
    "Enable User": {
        id: "Enable User",
        catagory: 'directory',
        Icon: IconLockOpen,
        color: 'green',
        Component: EnableUser,
    },
    "Disable User": {
        id: "Disable User",
        catagory: 'directory',
        Icon: IconLock,
        color: 'pink',
        Component: EnableUser,
    },
    "Delete User": {
        id: "Delete User",
        catagory: 'directory',
        Icon: IconTrash,
        color: 'red',
        Component: EnableUser,
    },
    "Update Attributes": {
        id: "Update Attributes",
        catagory: 'directory',
        Icon: IconPencil,
        color: 'orange',
        Component: UpdateAttributes,
    },
    "Move Organisational Unit": {
        id: "Move Organisational Unit",
        catagory: 'directory',
        Icon: IconFolderShare,
        color: 'grape',
        Component: MoveOU,
    },
    "Write PDF": {
        id: "Write PDF",
        catagory: 'document',
        Icon: IconFileTypePdf,
        color: 'red',
        Component: WritePDF,
    },
    "Send To Printer": {
        id: "Send To Printer",
        catagory: 'document',
        Icon: IconPrinter,
        color: 'lime',
        Component: Print,
    },
    "Copy File": {
        id: "Copy File",
        catagory: 'file',
        Icon: IconCopy,
        color: 'blue',
        Component: CopyFile,
    },
    "Move File": {
        id: "Move File",
        catagory: 'file',
        Icon: IconArrowBarToRight,
        color: 'orange',
        Component: MoveFile,
    },
    "Delete File": {
        id: "Delete File",
        catagory: 'file',
        Icon: IconTrash,
        color: 'red',
        Component: DeleteFile,
    },
    "Copy Folder": {
        id: "Copy Folder",
        catagory: 'folder',
        Icon: IconCopy,
        color: 'blue',
        Component: CopyFolder,
    },
    "Move Folder": {
        id: "Move Folder",
        catagory: 'folder',
        Icon: IconArrowBarToRight,
        color: 'orange',
        Component: MoveFolder,
    },
    "Delete Folder": {
        id: "Delete Folder",
        catagory: 'folder',
        Icon: IconTrash,
        color: 'red',
        Component: DeleteFolder,
    },
    "Template": {
        label: "Build Data Template",
        id: "Template",
        catagory: 'system',
        Icon: IconTemplate,
        Component: Template,
        perRule: false
    },
    //TODO - STMC upload
    //"Upload Student Passwords": {
    //    id: "Upload Student Passwords",
    //    catagory: 'edustar',
    //    Icon: IconCloudUpload,
    //    color: 'yellow',
    //},
    //TODO - update groups
    //NOTE - Should work in theory, but not currently implemented due to arbitrary code execution vulnerability concerns:
    //LINK - client\src\components\Rules\Editor\Operations\RunCommand.tsx
    //"Run Command": {
    //    id: "Run Command",
    //    catagory: 'system',
    //    Icon: IconTerminal,
    //    Component: RunCommand,
    //},
    //TODO - emailing
    //"Send Email": {
    //    id: "Send Email",
    //    catagory: 'system',
    //    Icon: IconMail,
    //},
}