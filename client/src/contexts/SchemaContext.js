import { createContext, useContext, useState ,useEffect } from 'react'

import useFetch from '../hooks/useFetch.js'

const Context = createContext({});
export const UseSchemaContext = () => useContext(Context);
export default Context;

export function ContextProvider(props) {
  const [ schemaName, setSchemaName ] = useState(false);
  const { data, fetch: getSchema, loading, setData } = useFetch({
      url: `/schema/${schemaName}`,
      reset: false,
      load: true,
      default: {
        Templates: [],
        Overrides: [],
        Rules: [],
        name: "loading",
        ldap_uri: "",
        ldap_user: "",
        ldap_pass: "",
        csv_path: "",
        csv_header: "ID",
        base_ou: "",
        use_edustar: false,
        use_cron: false,
        csv_monitor: false,
        autoexe: false,
        cron: "* * * * *",
        printer: "System Default",
      },
      then: data => {
        if (data.csv_path && data.csv_path!=="") getCSV({data: { csv_path: data.csv_path }});
      }
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ if (schemaName && schemaName !== data.name) getSchema() }, [ schemaName ] )
  const { data: saved, fetch: saveToServer, loading: saving, invalid } = useFetch({
    url: `/schema/${schemaName}`,
    method: "put",
    data,
    //before: d => console.log(d)
    then: s => { if (s.csv_path.trim()!=="") getCSV(); else clearCSV(); }
  });
  const change = (changes)=> {
    setData(data=>({...data, ...changes}));
  }

  const { data: csv, fetch: getCSV, reset: clearCSV, loading: loadingCSV } = useFetch({ url: `/schema/${schemaName}/csv`, data: { csv_path: data.csv_path } });

  return (
    <Context.Provider value={{
      sn: schemaName,
      setSchemaName,
      schema: data,
      refresh: getSchema,
      loading,
      change,
      invalid,
      save: saveToServer,
      saved,
      saving,
      csv,
      loadingCSV
    }}>
      {props.children}
    </Context.Provider>
  );
}
