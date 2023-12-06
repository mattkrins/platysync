import { useState, PropsWithChildren } from 'react';
import CommonContext from './CommonContext';

// LINK: ./CommonContext.tsx
export default function CommonProvider({ children  }: PropsWithChildren) {
    const [nav, setNav] = useState<string>('Dashboard');
    const changeNav = (nav: string) => setNav(nav);
    return (
        <CommonContext.Provider value={{ nav, changeNav }}>
            {children}
        </CommonContext.Provider>
    );
}