import { createContext, useContext } from 'react';

export interface openExplorerProps {
  input?: HTMLInputElement|null
  rule?: Rule;
  scope?: string[],
}

interface TemplateContext {
    opened: boolean,
    open(input?: openExplorerProps): void,
    close(): void,
    setInput(input: HTMLInputElement): void,
    setRule(rule: Rule): void,
    input?: HTMLInputElement,
    rule?: Rule,
    validate: (value?: string, rule?: Rule) => string | undefined,
    buildTemplate: (rule?: Rule) => {
      [k: string]: string | {[k: string]: string};
    }
  }

export const TemplateContext = createContext<TemplateContext>({
    opened: false,
    open(){},
    close(){},
    setInput(){},
    setRule(){},
    rule: undefined,
    validate: () => 'error',
    buildTemplate: () => ({}),
});

export const useTemplater = () => {
  return useContext(TemplateContext);
};
