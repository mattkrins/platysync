/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosStatic } from "axios";
import { Schema } from '../components/models.js';
import { FastifyRequest } from "fastify";

export interface AxiosFix extends AxiosStatic {
  default: AxiosStatic;
}

export interface userReq extends FastifyRequest {
  session?: Session;
  user?: User;
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