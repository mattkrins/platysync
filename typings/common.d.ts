interface Settings {
    [k: string]: unknown;
    key?: string;
    logLevel: string;
    redact: string[];
    enableRun?: boolean;
    proxy_url?: string;
    proxy_username?: string;
    proxy_password?: string|Hash;
    server?: {
        host: string;
        port: number;
    };
}

interface Log {
  timestamp: string;
  level: string;
  message: string;
  schema?: string;
  rule?: string;
}

interface Connector {
    id: string;
    name: string;
    type: 'provider'|'adapter';
    headers:  string[];
}

interface Source {
    foreignName: string;
    foreignKey?: string;
    primaryName: string;
    primaryKey?: string;
}

interface Condition {
    name: string,
    key: string,
    operator: string,
    value: string,
    delimiter?: string,
}

interface Rule {
    name: string;
    enabled: boolean;
    log: boolean;
    description?: string;
    primary?: string;
    primaryKey?: string;
    display?: string;
    sources: Source[];
    conditions: Condition[];
    actions: [];
}

interface psFile {
    name: string;
    path?: string;
    key?: string;
    format?: string;
}

interface Schema {
    name: string;
    version: string;
    connectors: Connector[];
    rules: Rule[];
    files: psFile[];
}

interface User {
    username: string;
    password: string;
    confirm?: string;
}

interface Session {
    username: string;
    expires: string;
    sessionId: string;
}

interface Hash {
    hex: string;
    iv: string;
    it: number;
}

interface template {
  [connector: string]: {[header: string]: string} | string | object
}