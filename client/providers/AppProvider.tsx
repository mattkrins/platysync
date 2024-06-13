import { PropsWithChildren } from "react";
import useAPI from "../hooks/useAPI";
import AppContext from "./AppContext";
import { getCookie } from "../modules/common";

export default function AppProvider({ children  }: PropsWithChildren) {
    const { data: api, get: getAPI, loading: loadingAPI } = useAPI<{ version: string }>({
        url: "/api/v1", default: { version: '' }, fetch: true,
    });
    const { data: schemas, get: getSchemas, loading: loadingSchemas } = useAPI<Schema[]>({
        url: "/api/v1/schemas", default: [], preserve: true, fetch: true,
    });
    const { data: user, get: getUser } = useAPI<{ username: '' }>({
        url: "/api/v1/auth", fetch: true,
        default: { username: '' },
        mutateData: () => getCookie("auth")
    });
    return (
        <AppContext.Provider value={{
            ...api,
            username: user.username,
            schemas,
            loadingAPI,
            loadingSchemas,
            getAPI,
            getSchemas,
            getUser,
        }}>{children}</AppContext.Provider>
    );
}
