import { createContext } from 'react';

// LINK: ./CommonProvider.tsx
const CommonContext = createContext<{
    nav?: string;
    changeNav: (nav: string) => void;
}>({
    changeNav: () => void {}
});

export default CommonContext;
