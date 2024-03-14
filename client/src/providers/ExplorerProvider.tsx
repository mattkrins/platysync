import { PropsWithChildren, useState } from 'react';
import ExplorerContext from './ExplorerContext';
import ExplorerComponent from './ExplorerComponent';
import { useDisclosure } from '@mantine/hooks';


// LINK: ./ExplorerContext.tsx
export default function ExplorerProvider({ children }: PropsWithChildren ) {
    const [opened, { open, close }] = useDisclosure(false);
    const [filter, setFilter] = useState<string[]|undefined>(undefined);
    const [templates, setTemplates] = useState<string[]|undefined>(undefined);
    const [click, setClick] = useState(() => (d: string) => {console.log(d)});
    const explorer = <ExplorerComponent click={click} filter={filter} templates={templates} opened={opened} close={close} />
    const explore = (click: (d: string) => void, filter?: string[], templates?: string[]) => {
        open();
        setClick(click);
        setFilter(filter||undefined);
        setTemplates(templates||undefined);
    }
    return (
        <ExplorerContext.Provider value={{ explorer, explore, close  }}>
            {children}
        </ExplorerContext.Provider>
    );
}