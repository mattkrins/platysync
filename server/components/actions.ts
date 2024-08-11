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
import SysComparator from "./actions/SysComparator";
import SysEncryptString from "./actions/SysEncryptString";
import SysRunCommand from "./actions/SysRunCommand";
import SysTemplate from "./actions/SysTemplate";
import SysWait from "./actions/SysWait";
import { Engine } from "./engine";
import { connections } from "./providers";

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
  'SysComparator': SysComparator,
  'SysEncryptString': SysEncryptString,
  'SysRunCommand': SysRunCommand,
  'SysTemplate': SysTemplate,
  'SysWait': SysWait,
}