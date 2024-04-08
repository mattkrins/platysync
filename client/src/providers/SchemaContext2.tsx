import { createContext } from "react";

const defaults = { name: '', version: '', connectors: [], rules: [] };

interface SchemaProvided extends Schema {
    loadSchema(name?: string): void;
    close(): void;
    reset(): void;
    mutate(mutation: {[k: string]: unknown}): void;
    loading: boolean;
    loaders: {[key: string]: boolean|undefined};
    valid: boolean;
    initialValues: Schema;
    headers: headers;
}

// LINK: ./SchemaProvider2.tsx
const SchemaContext = createContext<SchemaProvided>({
    ...defaults,
    loading: false,
    valid: false,
    loaders: {},
    headers: {},
    loadSchema: () => void {},
    close: () => void {},
    reset: () => void {},
    mutate: () => void {},
    initialValues: defaults,
});

export default SchemaContext;