import { IconArrowBarToRight, IconBinaryTree2, IconCirclesRelation, IconCloudUpload, IconCopy, IconEqualNot, IconFile, IconFolder, IconFolderShare, IconKey, IconLock, IconLockOpen, IconMathFunction, IconPencil, IconPlus, IconSchool, IconTemplate, IconTerminal, IconTrash, IconUserQuestion, IconUsersGroup, TablerIconsProps } from '@tabler/icons-react';
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
        requires?: string[];
}[] = [
    {
        label: "Directory Operations",
        id: 'directory',
        requires: ['ldap'],
        Icon: IconBinaryTree2,
        color: "blue",
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
]

export const availableActions: {
    [key: string]: {
        id: string;
        label?: string;
        Icon: (props: TablerIconsProps) => JSX.Element;
        color?: string;
        catagory: catagory;
        Component: (props: ActionItem) => JSX.Element;
        perRule?: boolean;
        requires?: string[];
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
    "Update Groups": {
        id: "Update Groups",
        catagory: 'directory',
        Icon: IconUsersGroup,
        color: 'yellow',
        Component: DirUpdateSec,
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
    "Write To File": {
        id: "Write To File",
        catagory: 'file',
        Icon: IconPencil,
        color: 'lime',
        Component: FileWriteTxt,
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
    "Create Folder": {
        id: "Create Folder",
        catagory: 'folder',
        Icon: IconPlus,
        color: 'lime',
        Component: FolderCreate,
    },
    "Template": {
        label: "Build Data Template",
        id: "Template",
        catagory: 'system',
        Icon: IconTemplate,
        Component: Template,
    },
    "Encrypt String": {
        id: "Encrypt String",
        catagory: 'system',
        Icon: IconKey,
        Component: EncryptString,
    },
    "Comparator": {
        id: "Comparator",
        catagory: 'system',
        Icon: IconEqualNot,
        Component: SysComparator,
    },
    //NOTE - Should work in theory, but not currently implemented due to arbitrary code execution vulnerability concerns:
    //LINK - client\src\components\Rules\Editor\Operations\SysRunCommand.tsx
    //"Run Command": {
    //    id: "Run Command",
    //    catagory: 'system',
    //    Icon: IconTerminal,
    //    Component: RunCommand,
    //},
    "Upload Student Passwords": {
        id: "Upload Student Passwords",
        catagory: 'edustar',
        Icon: IconCloudUpload,
        color: 'yellow',
        Component: StmcUpload
    },
    //TODO - update groups
    //TODO - emailing
    //"Send Email": {
    //    id: "Send Email",
    //    catagory: 'system',
    //    Icon: IconMail,
    //},
}

/**
    Check if string is valid for the windows filesystem.
    @param value - Any string
    @returns true|false
*/
export function validWindowsFilename(value: string): boolean {
  const invalidChars = /[<>:"/\\|?*]/g;
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  return !invalidChars.test(value) && !reservedNames.test(value) && value.length <= 260 && value.length > 0;
}
