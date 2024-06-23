interface Settings {
    [k: string]: unknown;
    key?: string;
    logLevel: string;
    redact: string[];
    enableRun?: boolean;
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
    name: string;
    type: 'provider'|'adapter';
    id: string;
}

interface xFile {
    name: string;
    path: string;
}

interface Schema {
    name: string;
    version: string;
    connectors: Connector[];
    rules: [];
    files: xFile[];
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