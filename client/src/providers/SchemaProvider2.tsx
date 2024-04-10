import { PropsWithChildren, useContext, useEffect, useState } from 'react';
import SchemaContext from './SchemaContext2';
import useAPI from '../hooks/useAPI2';
import AppContext from './AppContext';

const defaults = { name: '', version: '', connectors: [], rules: [], headers: {}, valid: false };

interface headerData {
    headers: headers;
    errors: { [connector: string]: string };
}

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
    const { data: headerData, get: getHeaders, reset: clearHeaders } = useAPI<headerData>({
        url: `/schema/${name}/headers`,
        key: name,
        default: { headers: {}, errors: {} },
        preserve: true,
    });
    const schema = (data||defaults);

    useEffect(()=>{ if (name&&name!=='') { getHeaders(); } else { clearHeaders(); } }, [ schema.connectors ]);

    useEffect(()=>{ if (name&&name!=='') { fetch(); } else { reset(); changeNav('Settings'); } }, [ name ]);
    return (
        <SchemaContext.Provider value={{
            ...schema,
            initialValues: schema,
            loading,
            loaders,
            valid: data ? data.name !== '' : false,
            headers: (headerData||{}).headers,
            loadSchema,
            reset,
            mutate,
            close: () => loadSchema(undefined),
        }}>{children}</SchemaContext.Provider>
    );
}