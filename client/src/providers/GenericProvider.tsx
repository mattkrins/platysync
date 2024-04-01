import { useLocalStorage } from '@mantine/hooks';
import { PropsWithChildren, createContext, useState } from 'react';

interface Props {
    login: (session: string) => void;
    logout: () => void;
    changeNav: (nav: string) => void;
    nav?: string;
    session?: string;
}

const defaults = {
    login: () => void {},
    logout: () => void {},
    changeNav: () => void {},
};

const AppContext = createContext<Props>(defaults);
export default AppContext;

export  function AppProvider({ children  }: PropsWithChildren) {
    const [stored, setStored, logout] = useLocalStorage({ key: 'session', defaultValue: '' });
    const session = (stored||"")==="" ? undefined : stored;
    const [nav, setNav] = useState<string>('Settings');
    const changeNav = (nav: string) => setNav(nav);
    const login = (session: string) => setStored(session);
    return (
        <AppContext.Provider value={{...defaults,
            login,
            logout,
            changeNav,
            nav,
            session,
        }}>{children}</AppContext.Provider>
    );
}