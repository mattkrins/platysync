import { PropsWithChildren } from "react";
import useAPI from "../hooks/useAPI";
import SchemaContext from "./SchemaContext";

export default function SchemaProvider({ children  }: PropsWithChildren) {
    const { data, get, loading: loadingSchema } = useAPI<Schema>({
        url: "/api/v1/schema", default: { version: '' }, fetch: true, preserve: true,
    });
    const getSchema = (name: string) => get({append: `/${name}`});
    return (
        <SchemaContext.Provider value={{
            ...data,
            loadingSchema,
            getSchema,
        }}>{children}</SchemaContext.Provider>
    );
}
