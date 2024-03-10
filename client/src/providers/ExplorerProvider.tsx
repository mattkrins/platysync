import { PropsWithChildren, useState } from 'react';
import ExplorerContext from './ExplorerContext';
import ExplorerComponent from './ExplorerComponent';
import { useDisclosure } from '@mantine/hooks';


// LINK: ./ExplorerContext.tsx
export default function ExplorerProvider({ children }: PropsWithChildren ) {
    const [opened, { open, close }] = useDisclosure(false);
    const [filter, setFilter] = useState<string[]|undefined>(undefined);
    const [click, setClick] = useState(() => (d: string) => {console.log(d)});
    const explorer = <ExplorerComponent click={click} filter={filter} opened={opened} close={close} />
    const explore = (click: (d: string) => void, filter?: string[]) => {
        open();
        setClick(click);
        setFilter(filter||undefined);
    }
    return (
        <ExplorerContext.Provider value={{ explorer, explore, close  }}>
            {children}
        </ExplorerContext.Provider>
    );
}