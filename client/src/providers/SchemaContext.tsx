import { createContext } from 'react';

// LINK: ./SchemaProvider.tsx
const SchemaContext = createContext<{
    schema?: Schema;
    loading?: string|false;
    connectors: Connector[];
    rules: Rule[];
    _connectors: { [name: string]: Connector };
    _rules: { [name: string]: Rule };
    headers: { [name: string]: string[] };
    changeSchema: (str: string|undefined) => void;
    reload(): void;
    mutate(update: object): void;
}>({
    schema: undefined,
    loading: false,
    connectors: [],
    rules: [],
    _rules: {},
    _connectors: {},
    headers: {},
    changeSchema: () => void {},
    reload: () => void {},
    mutate: () => void {}
});

export default SchemaContext;
