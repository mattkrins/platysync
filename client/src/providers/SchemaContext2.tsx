import { createContext } from "react";

interface SchemaProvided extends Schema {
    loadSchema(name?: string): void;
    reset(): void;
    loading: boolean;
    loaders: {[key: string]: boolean};
    valid: boolean;
}

// LINK: ./SchemaProvider2.tsx
const SchemaContext = createContext<SchemaProvided>({
    name: '',
    version: '',
    connnectors: [],
    rules: [],
    loading: false,
    valid: false,
    loaders: {},
    loadSchema: () => void {},
    reset: () => void {},
});

export default SchemaContext;