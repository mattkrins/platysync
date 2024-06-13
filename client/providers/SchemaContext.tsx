import { createContext } from "react";

interface SchemaContext extends Schema {
    loadingSchema: boolean;
    getSchema(name: string): Promise<Schema>;
}

const defaultSchema: Schema = {
    name: '',
    version: '',
};

const SchemaContext = createContext<SchemaContext>({
    ...defaultSchema,
    loadingSchema: false,
    getSchema: () => Promise.resolve(defaultSchema),
});
export default SchemaContext;