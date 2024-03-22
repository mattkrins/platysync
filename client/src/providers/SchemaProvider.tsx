import { useState, PropsWithChildren, useEffect, useContext } from 'react';
import SchemaContext from './SchemaContext';
import useAPI from '../hooks/useAPI';
import CommonContext from './CommonContext';
import { notifications } from '@mantine/notifications';

// LINK: ./SchemaContext.tsx
export default function SchemaProvider({ children  }: PropsWithChildren) {
    const { changeNav } = useContext(CommonContext);
    const [ name, _name ] = useState<string|undefined>(undefined)

    const { data, setData, loading: l, request, fetch, reset } = useAPI({
        url: `/schema/${name}`,
        loading: name,
        preserve: true,
        before: () => changeNav('Settings'),
        then: data => {
            changeNav('Schema');
            if (!data.errors || data.errors.length <= 0) return;
            notifications.show({ title: "Errors Detected",message: JSON.stringify(data.errors), color: 'red', autoClose: false });
        }
    });
    const loading = l ? (request as {loading: string|undefined}).loading : false;
    useEffect(()=>{
        if (name) { fetch(); } else { reset(); changeNav('Settings') }
    }, [ name ])

    const changeSchema = (nav: string|undefined) => _name(nav);
    const mutate = (update: object = {}) => setData({...data, ...update});
    
    return (
        <SchemaContext.Provider value={{
            schema: data,
            loading,
            connectors: data?data.connectors:[],
            _connectors: data?data._connectors:{},
            rules: data?data.rules:[],
            _rules: data?data._rules:{},
            headers: data?data.headers:{},
            changeSchema,
            reload: fetch,
            mutate
        }}>{children}</SchemaContext.Provider>
    );
}