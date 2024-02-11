import { createContext } from 'react';

// LINK: ./AuthProvider.tsx
const AuthContext = createContext<{
    authed: string|undefined;
    session: undefined|{
        username: string,
        session: string,
        expires: string,
    }
    version: number,
    logout(): void;
    login(user: string): void;
}>({
    authed: undefined,
    session: undefined,
    version: 0,
    logout: () => {},
    login: () => {},
});

export default AuthContext;
