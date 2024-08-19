import DocPrintPDF from "./actions/DocPrint";
import DocWritePDF from "./actions/DocWritePDF";
import FileCopy from "./actions/FileCopy";
import FileDelete from "./actions/FileDelete";
import FileMove from "./actions/FileMove";
import FileWriteTxt from "./actions/FileWriteTxt";
import FolderCopy from "./actions/FolderCopy";
import FolderCreate from "./actions/FolderCreate";
import FolderDelete from "./actions/FolderDelete";
import FolderMove from "./actions/FolderMove";
import StmcUpStuPass from "./actions/StmcUpStuPass";
import StmcUpStuPassBulk from "./actions/StmcUpStuPassBulk";
import SysComparator from "./actions/SysComparator";
import SysEncryptString from "./actions/SysEncryptString";
import SysRunCommand from "./actions/SysRunCommand";
import SysTemplate from "./actions/SysTemplate";
import SysWait from "./actions/SysWait";
import { Engine } from "./engine";
import { connections, contexts } from "./providers";
import { configs } from "./configs/base";
import TransEmailSend from "./actions/TransEmailSend";

interface handle<type=unknown> {
  handle: type;
  close(): Promise<void>;
}
export type handles = { [id: string]: handle };

export interface props<type> {
  action: Action & type;
  template: template;
  connections: connections;
  contexts: contexts;
  configs: configs;
  execute: boolean;
  engine: Engine;
  handles: handles
  data: rString<type>;
  settings: Settings;
  schema: Schema;
  id?: string;
}

export type operation = (props: props<any>) => Promise<result>;
export const availableActions: { [k: string]: operation } = {
  'DocWritePDF': DocWritePDF,
  'DocPrintPDF': DocPrintPDF,
  'FileCopy': FileCopy,
  'FileDelete': FileDelete,
  'FileMove': FileMove,
  'FileWriteTxt': FileWriteTxt,
  'FolderCopy': FolderCopy,
  'FolderCreate': FolderCreate,
  'FolderDelete': FolderDelete,
  'FolderMove': FolderMove,
  'StmcUpStuPass': StmcUpStuPass,
  'StmcUpStuPassBulk': StmcUpStuPassBulk,
  'SysComparator': SysComparator,
  'SysEncryptString': SysEncryptString,
  'SysRunCommand': SysRunCommand,
  'SysTemplate': SysTemplate,
  'SysWait': SysWait,
  'TransEmailSend': TransEmailSend,
}
