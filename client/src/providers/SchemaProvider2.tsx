import { PropsWithChildren, useContext, useEffect, useState } from 'react';
import SchemaContext from './SchemaContext2';
import useAPI from '../hooks/useAPI2';
import AppContext from './AppContext';

const defaults = { name: '', version: '', connnectors: [], rules: [], valid: false };

// LINK: ./SchemaContext2.tsx
export default function SchemaProvider({ children }: PropsWithChildren) {
    const { changeNav } = useContext(AppContext);
    const [ name, loadSchema ] = useState<string|undefined>(undefined);
    const { data, loading, fetch, reset, loaders, mutate } = useAPI<Schema>({
        url: `/schema/${name}`,
        key: name,
        default: defaults,
        preserve: true,
        then: () => changeNav('Schema')
    });
    useEffect(()=>{ if (name&&name!=='') { fetch(); } else { reset(); changeNav('Settings'); } }, [ name ]);
    return (
        <SchemaContext.Provider value={{
            ...(data||defaults),
            initialValues: (data||defaults),
            loading,
            loaders,
            valid: data ? data.name !== '' : false,
            loadSchema,
            reset,
            mutate,
            close: () => loadSchema(undefined),
        }}>{children}</SchemaContext.Provider>
    );
}