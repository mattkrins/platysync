/* eslint-disable @typescript-eslint/no-explicit-any */
interface Schema {
    name: string;
    version: number;
    connectors: Connector[];
    _connectors: { [name]: Connector };
}
interface Connector {
    id: string;
    name: string;
    img: string;
}

interface Condition {
    type: 'string' | 'math' | 'group' | 'ou';
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
    secondaries: {id: string, primary: string, secondaryKey: string, primaryKey: string}[];
    conditions: Condition[];
    actions: Action[];
    before_actions: Action[];
    after_actions: Action[];
    log?: string;
    [key: string]: unknown;
}

type explore = (click: (d: string) => void, filter?: string[], templates?: string[]) => void;

interface ActionItem {
    form: UseFormReturnType<Rule>;
    index: number;
    explorer: (key: string) => JSX.Element;
    explore: explore;
    actionType: string;
    hasLDAP?: boolean;
    sources: string[];
}