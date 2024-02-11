import { PropsWithChildren } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import AuthContext from './AuthContext';

// LINK: ./AuthContext.tsx
export default function AuthProvider({ children  }: PropsWithChildren) {
    const [store, login, clearAuth] = useLocalStorage({ key: 'auth', defaultValue: '{}' });
    const session = (JSON.parse(store||"{}") || {})
    const authed = session.session || undefined;
    const version = parseFloat(session.version) || 0;
    const logout = () => {
        clearAuth();
    }
    return (
        <AuthContext.Provider value={{ authed, session, logout, login, version }}>
            {children}
        </AuthContext.Provider>
    );
}