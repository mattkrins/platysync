import { createContext } from "react";

const defaults = { name: '', version: '', connnectors: [], rules: [] };

interface SchemaProvided extends Schema {
    loadSchema(name?: string): void;
    close(): void;
    reset(): void;
    mutate(mutation: {[k: string]: unknown}): void;
    loading: boolean;
    loaders: {[key: string]: boolean};
    valid: boolean;
    initialValues: Schema;
}

// LINK: ./SchemaProvider2.tsx
const SchemaContext = createContext<SchemaProvided>({
    ...defaults,
    loading: false,
    valid: false,
    loaders: {},
    loadSchema: () => void {},
    close: () => void {},
    reset: () => void {},
    mutate: () => void {},
    initialValues: defaults,
});

export default SchemaContext;