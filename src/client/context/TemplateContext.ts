import { UseFormReturnType } from '@mantine/form';
import { createContext, useContext } from 'react';

export interface openExplorerProps {
  input?: HTMLInputElement|null
  rule?: UseFormReturnType<Rule>;
  scope?: string[],
}

interface TemplateContext {
    opened: boolean,
    open(input?: openExplorerProps): void,
    close(): void,
    setInput(input: HTMLInputElement): void,
    input?: HTMLInputElement,
    scope: string[],
    inRule: boolean,
    validate: (value?: string) => string | undefined,
    template: {
      [k: string]: string | {[k: string]: string};
    }
  }

export const TemplateContext = createContext<TemplateContext>({
    opened: false,
    open(){},
    close(){},
    setInput(){},
    scope: [],
    inRule: false,
    validate: () => 'error',
    template: {},
});

export const useTemplater = () => {
  return useContext(TemplateContext);
};
