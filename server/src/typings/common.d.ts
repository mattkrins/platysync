/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosStatic } from "axios";

export interface AxiosFix extends AxiosStatic {
  default: AxiosStatic;
}

export interface Schema {
    name: string;
    version: number;
    connectors: Connector[];
    _connectors: { [name: string]: Connector };
    rules: Rule[];
    _rules: { [name: string]: Rule };
    headers: { [name: string]: string[] };
    errors: string[];
}

export interface SchemaYaml extends Schema {
  _connectors?: { [name: string]: Connector };
  _rules?: { [name: string]: Rule };
  headers?: { [name: string]: string[] };
  errors?: string[];
}

export interface Connector {
  id: string;
  name: string;
  [k: string]: any;
}

export interface Condition {
  type: string;
  key: string;
  operator: string;
  value: string;
  delimiter: '' | ',' | ';' | '|' | 'tab' | ' ';
}

export interface Attribute {
  name: string;
  value: string;
}

export interface Action {
  name: string;
  value?: string;
  source?: string;
  target?: string;
  cn?: string;
  sam?: string;
  password?: string;
  upn?: string;
  ou?: string;
  attributes?: Attribute[];
  groups?: unknown[];
  conditions?: Condition[];
  templates?: { name: string, value: string }[];
}

export interface secondary {
  id: string;
  primary: string;
  secondaryKey: string;
  primaryKey: string;
  case?: boolean;
  req?: boolean;
  oto?: boolean;
}

export interface Rule {
  name: string;
  display: string;
  enabled: boolean;
  position: number;
  primary: string;
  primaryKey: string;
  secondaries: secondary[];
  conditions: Condition[];
  before_actions: Action[];
  after_actions: Action[];
  actions: Action[];
  config: {[k: string]: {[k: string]: unknown} };
  log?: string;
  test?: boolean;
}

export interface template {
  [connector: string]: {
    [header: string]: string
  } | string;
}

export interface result {
  error?: string;
  warning?: string;
  success?: true;
  template?: true;
  data?: {[k: string]: unknown};
}

export interface connection {
  rows: {[k: string]: string}[];
  keyed: {[k: string]: object};
  provider?: anyProvider;
  client?: unknown;
  close?: () => Promise<unknown>;
}
export interface connections { [k: string]: connection }
export interface actionProps {
  action: Action;
  template: template;
  connections: connections;
  id: string;
  schema: Schema;
  execute: boolean;
  keys: sKeys;
  data: {[k: string]: string};
}

export interface template {
  [connector: string]: {[header: string]: string} | string | object
}