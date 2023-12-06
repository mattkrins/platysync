import { createContext } from 'react';

// LINK: ./ExplorerProvider.tsx
const ExplorerContext = createContext<{
    explorer: JSX.Element;
    explore: explore;
    close: () => void;
}>({
    explorer: <></>,
    explore: () => void {},
    close: () => void {},
});

export default ExplorerContext;
