type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/** Replace all properties with strings. */
type rString<T> = { [K in keyof T]: string; };

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
        https?: false | {
            crt: string;
            key: string;
        }
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
    headers:  string[];
    [k: string]: unknown;
}

interface Context {
    name: string;
    [k: string]: unknown;
}

interface Source {
    foreignName: string;
    foreignKey?: string;
    primaryName: string;
    primaryKey?: string;
    inCase?: boolean;
    require?: boolean;
}

interface Condition {
    name: string,
    key: string,
    operator: string,
    value: string,
    delimiter?: string,
    and?: boolean,
    case?: boolean,
}

interface FormDataValue {
    type: string,
    key: string,
    value: string,
}

interface SysTemplate {
    key: string,
    value: string,
}

interface ActionConfig {
    id: string,
    name: string,
    config: Action;
}

interface Action {
    name: string,
    display?: string,
    enabled?: boolean,
    noblock?: boolean,
    validate?: boolean,
    overwrite?: boolean,
    config?: string,
    [k: string]: unknown;
}

interface resultColumn {
    name: string;
    value: string;
}

interface Rule {
    name: string;
    enabled: boolean;
    log: boolean;
    description?: string;
    primary?: string;
    primaryKey?: string;
    idName?: string;
    display?: string;
    displayKey?: string;
    sources: Source[];
    contexts: Context[];
    conditions: Condition[];
    initActions: Action[];
    iterativeActions: Action[];
    finalActions: Action[];
    columns: resultColumn[];
}

interface evalRule extends Rule {
    test?: boolean;
    context?: string[];
}

interface psFile {
    name: string;
    path?: string;
    key?: string;
    format?: string;
}

interface Task {
    name: string;
    enabled: boolean;
    rules?: string[];
}

interface Trigger {
    name: string;
    enabled: boolean;
    cron: string;
    watch: string;
}

interface Schedule {
    name: string;
    enabled: boolean;
    description?: string;
    failAfter?: number;
    disableAfter?: number;
    triggers: [];
    tasks: Task[];
}

interface Schema {
    name: string;
    version: string;
    files: psFile[];
    connectors: Connector[];
    rules: Rule[];
    actions: ActionConfig[];
    schedules: Schedule[];
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
  [connector: string]: {[header: string]: string}
}

interface xError {
    message: string;
    name: string = "Error";
    stack?: string|NodeJS.CallSite[];
    field?: string;
    status?: number;
    errors?: { [k: string]: string };
}

interface result {template?: object, success?: boolean, error?: xError|string, noblock?: boolean, warn?: string, data?: { [k: string]: unknown }}
interface actionResult {
    name: string;
    display?: string;
    result: result;
    noblock?: boolean;
}
interface primaryResult { id: string, Display?: string, actions: actionResult[], columns: resultColumn[], checked?: boolean, error?: boolean, warn?: boolean }
interface response {
    primaryResults: primaryResult[];
    finalActions: actionResult[];
    initActions: actionResult[];
    columns: string[];
    id?: string;
}

interface jobStatus {
    progress: {
        total: number;
        init: number|boolean;
        connect: number|boolean;
        iterative: number|boolean;
        final: number|boolean;
    };
    iteration: {
        current: number;
        total: number|boolean;
    };
    eta: string|boolean;
    text: string;
}