import { useLocalStorage } from '@mantine/hooks';
import { PropsWithChildren, useEffect, useState } from 'react';

import AppContext, { session } from './AppContext';
import useAPI from '../hooks/useAPI2';

// LINK: ./AppContext.tsx
export default function AppProvider({ children  }: PropsWithChildren) {
    const [stored, setSession, clearSession] = useLocalStorage({ key: 'session', defaultValue: '' });
    const session = (stored||"")==="" ? undefined : stored;
    const [nav, setNav] = useState<string>('Settings');
    const changeNav = (nav: string) => setNav(nav);
    const login = (session: session) => { if (!session.id) return; setSession(session.id); }
    const { data, get, reset, loading: loggingIn } = useAPI<session>({ url: `/auth`, noAuth: true });
    useEffect(()=>{ if (session) { get({headers: { Authorization : `Bearer ${session}` }}); } else { reset(); } }, [ session ]);
    const { del, loading: loggingOut } = useAPI({ url: `/auth` });
    const logout = () => {
        del();
        clearSession();
    }
    return (
        <AppContext.Provider value={{
            ...data,
            loggingIn,
            loggingOut,
            login,
            logout,
            changeNav,
            nav,
            session,
        }}>{children}</AppContext.Provider>
    );
}