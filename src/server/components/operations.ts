import { Engine } from "./engine.js";
import { connections } from "./providers.js";
import DocPrintPDF from "./operations/DocPrint.js";
import DocWritePDF from "./operations/DocWritePDF.js";
import FileCopy from "./operations/FileCopy.js";
import FileDelete from "./operations/FileDelete.js";
import FileMove from "./operations/FileMove.js";
import FileWriteTxt from "./operations/FileWriteTxt.js";
import FolderCopy from "./operations/FolderCopy.js";
import FolderCreate from "./operations/FolderCreate.js";
import FolderDelete from "./operations/FolderDelete.js";
import FolderMove from "./operations/FolderMove.js";
import StmcUpStuPass from "./operations/StmcUpStuPass.js";
import StmcUpStuPassBulk from "./operations/StmcUpStuPassBulk.js";
import SysComparator from "./operations/SysComparator.js";
import SysEncryptString from "./operations/SysEncryptString.js";
import SysRunCommand from "./operations/SysRunCommand.js";
import SysTemplate from "./operations/SysTemplate.js";
import SysWait from "./operations/SysWait.js";
import TransEmailSend from "./operations/TransEmailSend.js";
import LdapCreateUser from "./operations/LdapCreateUser.js";
import LdapDeleteUser from "./operations/LdapDeleteUser.js";
import LdapDisableUser from "./operations/LdapDisableUser.js";
import LdapEnableUser from "./operations/LdapEnableUser.js";
import LdapMoveOU from "./operations/LdapMoveOU.js";
import LdapUpdateAccount from "./operations/LdapUpdateAccount.js";
import LdapUpdateAttributes from "./operations/LdapUpdateAttributes.js";
import LdapUpdateGroups from "./operations/LdapUpdateGroups.js";
import FileWriteCSV from "./operations/FileWriteCSV.js";
import TransAPIRequest from "./operations/TransAPIRequest.js";
import SysDecryptString from "./operations/SysDecryptString.js";
import Operation from "./operation.js";

interface handle<type=unknown> {
  handle: type;
  close(): Promise<void>;
}
export type handles = { [id: string]: handle };

export interface props<type> {
  action: Action & type;
  template: template;
  connections: connections;
  execute: boolean;
  engine: Engine;
  handles: handles
  data: rString<type>;
  settings: Settings;
  schema: Schema;
  id?: string;
}

export interface operationReturn<type = Operation> {
  success?: boolean;
  error?: xError|string;
  warn?: string;
  data: rString<type>;
}

type OperationConstructor<T = object> = new (_action: Action) => Operation<T>;
export const availableOperations: { [k: string]: OperationConstructor } = {
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
};
