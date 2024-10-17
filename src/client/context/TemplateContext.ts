import { createContext, useContext } from 'react';

interface ThemeContext {
    opened: boolean,
    open(): void,
    close(): void,
    setInput(input: HTMLInputElement): void,
    input?: HTMLInputElement,
}

export const ThemeContext = createContext<ThemeContext>({
    opened: false,
    open(){},
    close(){},
    setInput(input: HTMLInputElement){},
    input: undefined,
});

export const useTemplate = () => {
  return useContext(ThemeContext);
};
