import { createContext } from 'react';

// LINK: ./AuthProvider.tsx
const AuthContext = createContext<{
    authed: string|undefined;
    session: undefined|{
        username: string,
        session: string,
        expires: string,
    }
    logout(): void;
    login(user: string): void;
}>({
    authed: undefined,
    session: undefined,
    logout: () => {},
    login: () => {},
});

export default AuthContext;
