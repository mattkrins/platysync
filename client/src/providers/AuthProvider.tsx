import { PropsWithChildren } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import AuthContext from './AuthContext';

// LINK: ./AuthContext.tsx
export default function AuthProvider({ children  }: PropsWithChildren) {
    const [store, login, clearAuth] = useLocalStorage({ key: 'auth', defaultValue: '{}' });
    const session = (JSON.parse(store||"{}") || {})
    const authed = session.session || undefined;
    const logout = () => {
        clearAuth();
    }
    return (
        <AuthContext.Provider value={{ authed, session, logout, login }}>
            {children}
        </AuthContext.Provider>
    );
}