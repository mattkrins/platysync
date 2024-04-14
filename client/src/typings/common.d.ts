/* eslint-disable @typescript-eslint/no-explicit-any */
interface Schema {
    name: string;
    version: string;
    connectors: Connector[];
    rules: Rule[];
    [k: string]: unknown;
}

interface headers { [connector: string]: string[] }

interface Connector {
    id: string;
    name: string;
    [k: string]: unknown;
}

interface Doc {
    id: string;
    index: number;
    name: string;
    ext: string;
    updatedAt: string;
    [k: string]: unknown;
}

interface Condition {
    type: 'string' | 'math' | 'group' | 'ou' | 'file';
    key: string;
    operator: string;
    value: string;
    delimiter: '' | ',' | ';' | '|' | 'tab' | ' ';
    [k: string]: unknown;
}

interface Action {
    name: string;
    groups: unknown[];
    attributes: {name:string,value:string, [k: string]: unknown;}[];
    templates: {name:string,value:string, [k: string]: unknown;}[];
    [k: string]: unknown;
}

interface Rule {
    name: string;
    description: string;
    enabled: boolean;
    primary: string;
    primaryKey: string;
    display: string;
    secondaries: {primary: string, secondaryKey: string, primaryKey: string}[];
    conditions: Condition[];
    actions: Action[];
    before_actions: Action[];
    after_actions: Action[];
    log?: string;
    config: { [key: string]: unknown };
    [key: string]: unknown;
}

type explore = (click: (d: string) => void, filter?: string[], templates?: string[]) => void;

type templateProps = (form: UseFormReturnType<any>, path: string, templates?: string[], buttons?: JSX.Element) => {
    error: boolean;
    value?: string;
    checked?: boolean;
    onChange(): void;
    onFocus?(): void;
    onBlur?(): void;
    rightSection: JSX.Element;
}

interface ActionItem {
    form: UseFormReturnType<Rule>;
    index: number;
    templateProps: templateProps;
    actionType: string;
    sources: string[];
    templates: string[];
}

interface evaluated { checked?: boolean, id: string, display?: string, actions: action[], actionable: boolean }

interface response {
    evaluated: evaluated[];
    finalActions: action[];
    initActions: action[];
}

interface action {
    name: string;
    result: { warn?: string, error?: string, data?: {[k: string]: unknown} };
}

interface schedule {
    id: string;
    index: number;
    schema: string;
    rules: string[];
    type: string;
    value: string;
    enabled: boolean;
    error?: boolean;
}

interface user {
    username: string;
    stats: boolean;
    createdAt: string;
    updatedAt: string;
    group: string;
    password?: string;
    enabled: boolean;
}