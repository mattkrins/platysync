import { xError } from "../modules/common";
import { compile } from "../modules/handlebars";
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
import { configs, connections, contexts } from "./providers";
import LDAPProvider from "./providers/LDAP.js";
import { User } from "../modules/ldap.js";
import { decrypt } from "../modules/cryptography";

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
}

export interface LdapProps {
  connector: string;
  userFilter?: string;
}

export async function getUser({ action, template, data, connections, contexts, engine, id }: props<LdapProps>, canBeFalse = false): Promise<User> {
  data.connector = String(action.connector);
  data.userFilter = compile(template, action.userFilter);
  if (!data.connector) throw new xError("Connector not provided.");
  let ldap = connections[data.connector] as LDAPProvider|undefined;
  if (!ldap) ldap = contexts[data.connector] as LDAPProvider|undefined;
  if (!ldap || !ldap.client) throw new xError(`Provider '${data.connector}' not connected.`);
  const user = await engine.ldap_getUser( data.connector, template, id, undefined, data.userFilter );
  if (!canBeFalse && !user) throw new xError("User not found.");
  return user as User;
}

export async function useConfig(configs: configs, name: string, schema: Schema) {
  if (configs[name]) return configs[name];
  const config = schema.actions.find(c=>c.name===name);
  if (!config) throw new xError(`Config '${name}' does not exist.`);
  if (config.password) config.password = await decrypt(config.password as Hash);
  configs[name] = config;
  return config;
}