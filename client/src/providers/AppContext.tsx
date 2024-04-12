import { createContext } from "react";

export interface session {
    username?: string;
    group?: string;
    id?: string;
    expires?: Date;
    version?: string;
}

export interface Props extends session {
    login: (session: session) => void;
    logout: () => void;
    changeNav: (nav: string) => void;
    nav?: string;
    session?: string;
    loggingIn: boolean;
    loggingOut: boolean;
    schemas: string[];
    creatingSchema: boolean;
    refreshSchemas: () => void;
}

// LINK: ./AppProvider.tsx
const AppContext = createContext<Props>({
    login: () => void {},
    logout: () => void {},
    changeNav: () => void {},
    loggingIn: false,
    loggingOut: false,
    schemas: [],
    creatingSchema: false,
    refreshSchemas: () => void {},
});
export default AppContext;