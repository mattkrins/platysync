/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosStatic } from "axios";

export interface AxiosFix extends AxiosStatic {
  default: AxiosStatic;
}

export interface Schema {
    name: string;
    version: number;
    connectors: Connector[];
    _connectors: { [name: string]: Connector }
    rules: Rule[];
    _rules: { [name: string]: Rule },
    headers: { [name: string]: string[] }
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

export interface Action {
  name: string;
  target?: string
}

export interface secondary {id: string, primary: string, secondaryKey: string, primaryKey: string}

export interface Rule {
  name: string;
  display: string;
  enabled: boolean;
  position: number;
  primary: string;
  primaryKey: string;
  secondaries: secondary[];
  conditions: Condition[];
  actions: Action[];
}

export interface template {[connector: string]: {[header: string]: string}}


export interface result {
  error?: string,
  warning?: string,
  success?: true,
  template?: true,
  data?: {[k: string]: unknown}
}