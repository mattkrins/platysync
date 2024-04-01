import { PropsWithChildren, createContext } from 'react';

interface Schema2 {
    name: string;
    version: string;
}

const defaults = {
    name: '',
    version: '',
};

const SchemaContext = createContext<Schema2>(defaults);

export default SchemaContext;

export  function SchemaProvider({ children  }: PropsWithChildren) {
    return (
        <SchemaContext.Provider value={{...defaults,

        }}>{children}</SchemaContext.Provider>
    );
}