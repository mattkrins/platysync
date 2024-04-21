import { useLocalStorage } from '@mantine/hooks';
import { PropsWithChildren, useEffect, useState } from 'react';

import AppContext, { session, settings } from './AppContext';
import useAPI from '../hooks/useAPI';

// LINK: ./AppContext.tsx
export default function AppProvider({ children  }: PropsWithChildren) {
    const [stored, setSession, clearSession] = useLocalStorage({ key: 'session', defaultValue: '' });
    const session = (stored||"")==="" ? undefined : stored;
    const [nav, setNav] = useState<string>('Settings');
    const changeNav = (nav: string) => setNav(nav);
    const login = (session: session) => { if (!session.id) return; setSession(session.id); }
    const { data, get, reset, loading: loggingIn } = useAPI<session>({ url: `/auth`, noAuth: true, before: o => ({...o, headers: { Authorization : `Bearer ${session}` } }), });
    const { data: settings, get: getSettings, setData: setSettings } = useAPI<settings>({ url: `/settings`,
    before: o => ({...o, headers: { Authorization : `Bearer ${session}` } }), default: {
        version: '',
        logLevel: 'info',
    } });
    useEffect(()=>{ if (session) { get(); } else { reset(); } }, [ session ]);
    const { del, loading: loggingOut } = useAPI({ url: `/auth` });
    const { data: schemas, loading: creatingSchema, fetch: refreshSchemas } = useAPI<string[]>({
        url: "/schema",
        default: [],
        preserve: true,
        noAuth: true,
        before: o => ({...o, headers: { Authorization : `Bearer ${session}` }}),
        mutate: (schemas: Schema[]) => schemas.map(s=>(s.name)),
        catch: (_1, _2, error) => { if (((error.response||{}).status||400) === 401) logout(); },
    });

    useEffect(()=>{ if (data) { refreshSchemas(); getSettings(); } }, [ data ]);

    const logout = () => {
        del();
        clearSession();
    }
    return (
        <AppContext.Provider value={{
            ...data,
            settings,
            loggingIn,
            loggingOut,
            login,
            logout,
            changeNav,
            setSettings,
            nav,
            session,
            schemas,
            creatingSchema,
            refreshSchemas
        }}>{children}</AppContext.Provider>
    );
}