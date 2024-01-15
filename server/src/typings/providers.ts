/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hash } from "../modules/cryptography.js";

export interface Provider {
    id: string;
    name: string;
    eduhub?: string;
    [name: string]: any;
}

export type anyProvider = CSV|STMC|PROXY|LDAP;

export interface CSV extends Provider {
    path: string;
}

export interface PROXY extends Provider {
    url: string;
    username: string;
    password: string|Hash;
}

export interface LDAP extends Provider {
    url: string;
    username: string;
    password: string|Hash;
}

export interface STMC extends Provider {
    username: string;
    password: string|Hash;
    school: string;
    cache?: string;
    proxy?: string;
}