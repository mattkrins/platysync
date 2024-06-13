import { createContext } from "react";

interface AppContext {
    version: string;
    username: string;
    loadingAPI: boolean;
    loadingSchemas: boolean;
    schemas: Schema[];
    getAPI(): void;
    getSchemas(): void;
    getUser(): void;
}

const AppContext = createContext<AppContext>({
    version: '',
    username: '',
    schemas: [],
    loadingAPI: false,
    loadingSchemas: false,
    getAPI: () => void {},
    getSchemas: () => void {},
    getUser: () => void {},
});
export default AppContext;