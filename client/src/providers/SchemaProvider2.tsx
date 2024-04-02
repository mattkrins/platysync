import { PropsWithChildren, useContext, useEffect, useState } from 'react';
import SchemaContext from './SchemaContext2';
import useAPI from '../hooks/useAPI2';
import AppContext from './AppContext';

const defaults = { name: 'loading...', version: 'loading...', connnectors: [], rules: [], valid: false };

// LINK: ./SchemaContext2.tsx
export default function SchemaProvider({ children }: PropsWithChildren) {
    const { changeNav } = useContext(AppContext);
    const [ name, loadSchema ] = useState<string|undefined>(undefined)
    const { data, loading, fetch: refresh, reset, loaders } = useAPI<Schema>({
        url: `/schema/${name}`,
        key: name,
        default: defaults,
        preserve: true,
        then: e => console.log(e)
        //mutate: (schemas: Schema[]) => schemas.map(s=>({label: s.name})),
    });
    useEffect(()=>{
        if (name) { refresh(); } else { reset(); changeNav('Settings') }
    }, [ name ])

    return (
        <SchemaContext.Provider value={{ ...(data||defaults),
            loadSchema,
            reset,
            loading,
            loaders,
            valid: data ? data.name !== "loading..." : false,
        }}>{children}</SchemaContext.Provider>
    );
}