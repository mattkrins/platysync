import { PropsWithChildren, useState } from 'react';
import ExplorerContext from './ExplorerContext';
import ExplorerComponent from './ExplorerComponent';
import { useDisclosure } from '@mantine/hooks';


// LINK: ./ExplorerContext.tsx
export default function ExplorerProvider({ children }: PropsWithChildren ) {
    const [opened, { open, close }] = useDisclosure(false);
    const [click, setClick] = useState(() => (d: string) => {console.log(d)});
    const explorer = <ExplorerComponent click={click}  opened={opened} close={close} />
    const explore = (click: (d: string) => void) => {
        open();
        setClick(click);
    }
    return (
        <ExplorerContext.Provider value={{ explorer, explore, close  }}>
            {children}
        </ExplorerContext.Provider>
    );
}