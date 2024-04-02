import { useLocalStorage } from '@mantine/hooks';
import { PropsWithChildren, useState } from 'react';

import AppContext, { session } from './AppContext';
import useAPI from '../hooks/useAPI2';

// LINK: ./AppContext.tsx
export default function AppProvider({ children  }: PropsWithChildren) {
    const [stored, setSession, clearSession] = useLocalStorage({ key: 'session', defaultValue: '' });
    const session = (stored||"")==="" ? undefined : stored;
    const [nav, setNav] = useState<string>('Settings');
    const [username, setUsername] = useState<string|undefined>(undefined);
    const [expires, setExpires] = useState<Date|undefined>(undefined);
    const [version, setVersion] = useState<string|undefined>(undefined);
    const changeNav = (nav: string) => setNav(nav);
    const login = (session: session) => {
        if (!session.id) return;
        setSession(session.id);
        setUsername(session.username);
        setExpires(session.expires);
        setVersion(session.version);
    }
    const { del } = useAPI({ url: `/auth` });
    const logout = () => {
        del();
        clearSession();
    }
    return (
        <AppContext.Provider value={{
            login,
            logout,
            changeNav,
            nav,
            session,
            username,
            expires,
            version,
        }}>{children}</AppContext.Provider>
    );
}