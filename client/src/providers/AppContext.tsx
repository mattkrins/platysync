import { createContext } from "react";

export interface settings {
    version: string;
    logLevel: string;
}

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
    setSettings: (data: React.SetStateAction<settings>) => void;
    nav?: string;
    session?: string;
    loggingIn: boolean;
    loggingOut: boolean;
    schemas: string[];
    creatingSchema: boolean;
    refreshSchemas: () => void;
    settings: settings;
}

// LINK: ./AppProvider.tsx
const AppContext = createContext<Props>({
    login: () => void {},
    logout: () => void {},
    changeNav: () => void {},
    setSettings: () => void {},
    loggingIn: false,
    loggingOut: false,
    schemas: [],
    creatingSchema: false,
    refreshSchemas: () => void {},
    settings: {
        version: '',
        logLevel: 'info',
    },
});
export default AppContext;