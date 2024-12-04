import { Engine } from "./engine.js";
import { connections } from "./providers.js";
import { configs } from "./configs/base.js";
import DocPrintPDF from "./actions/DocPrint.js";
import DocWritePDF from "./actions/DocWritePDF.js";
import FileCopy from "./actions/FileCopy.js";
import FileDelete from "./actions/FileDelete.js";
import FileMove from "./actions/FileMove.js";
import FileWriteTxt from "./actions/FileWriteTxt.js";
import FolderCopy from "./actions/FolderCopy.js";
import FolderCreate from "./actions/FolderCreate.js";
import FolderDelete from "./actions/FolderDelete.js";
import FolderMove from "./actions/FolderMove.js";
import StmcUpStuPass from "./actions/StmcUpStuPass.js";
import StmcUpStuPassBulk from "./actions/StmcUpStuPassBulk.js";
import SysComparator from "./actions/SysComparator.js";
import SysEncryptString from "./actions/SysEncryptString.js";
import SysRunCommand from "./actions/SysRunCommand.js";
import SysTemplate from "./actions/SysTemplate.js";
import SysWait from "./actions/SysWait.js";
import TransEmailSend from "./actions/TransEmailSend.js";
import LdapCreateUser from "./actions/LdapCreateUser.js";
import LdapDeleteUser from "./actions/LdapDeleteUser.js";
import LdapDisableUser from "./actions/LdapDisableUser.js";
import LdapEnableUser from "./actions/LdapEnableUser.js";
import LdapMoveOU from "./actions/LdapMoveOU.js";
import LdapUpdateAccount from "./actions/LdapUpdateAccount.js";
import LdapUpdateAttributes from "./actions/LdapUpdateAttributes.js";
import LdapUpdateGroups from "./actions/LdapUpdateGroups.js";
import FileWriteCSV from "./actions/FileWriteCSV.js";
import TransAPIRequest from "./actions/TransAPIRequest.js";
import SysDecryptString from "./actions/SysDecryptString.js";

interface handle<type=unknown> {
  handle: type;
  close(): Promise<void>;
}
export type handles = { [id: string]: handle };

export interface props<type> {
  action: Action & type;
  template: template;
  connections: connections;
  configs: configs;
  execute: boolean;
  engine: Engine;
  handles: handles
  data: rString<type>;
  settings: Settings;
  schema: Schema;
  id?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type operation = (props: props<any>) => Promise<result>;
export const availableOperations: { [k: string]: operation } = {
  'DocWritePDF': DocWritePDF,
  'DocPrintPDF': DocPrintPDF,
  'FileCopy': FileCopy,
  'FileDelete': FileDelete,
  'FileMove': FileMove,
  'FileWriteCSV': FileWriteCSV,
  'FileWriteTxt': FileWriteTxt,
  'FolderCopy': FolderCopy,
  'FolderCreate': FolderCreate,
  'FolderDelete': FolderDelete,
  'FolderMove': FolderMove,
  'LdapCreateUser': LdapCreateUser,
  'LdapDeleteUser': LdapDeleteUser,
  'LdapDisableUser': LdapDisableUser,
  'LdapEnableUser': LdapEnableUser,
  'LdapMoveOU': LdapMoveOU,
  'LdapUpdateAccount': LdapUpdateAccount,
  'LdapUpdateAttributes': LdapUpdateAttributes,
  'LdapUpdateGroups': LdapUpdateGroups,
  'StmcUpStuPass': StmcUpStuPass,
  'StmcUpStuPassBulk': StmcUpStuPassBulk,
  'SysComparator': SysComparator,
  'SysDecryptString': SysDecryptString,
  'SysEncryptString': SysEncryptString,
  'SysRunCommand': SysRunCommand,
  'SysTemplate': SysTemplate,
  'SysWait': SysWait,
  'TransEmailSend': TransEmailSend,
  'TransAPIRequest': TransAPIRequest,
}
