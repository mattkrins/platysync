import { createContext, useContext } from 'react'

import useFetch from '../hooks/useFetch.js'

const Context = createContext({});
export const UseAppContext = () => useContext(Context);
export default Context;

export function ContextProvider(props) {
  const { data, fetch, loading, setData } = useFetch({
      url: `/settings`,
      reset: false,
      load: true,
      fetch: true,
      default: {
        proxy: "",
        edustar_user: "",
        edustar_pass: "",
        school_id: "",
        cache_policy: 24
      }
  });
  const { data: saved, fetch: save, loading: saving, invalid } = useFetch({ url: `/settings`, method: "put", data });
  const change = (changes)=> setData(data=>({...data, ...changes}));
  
  return (
    <Context.Provider value={{
      app: data,
      refresh: fetch,
      loading,
      change,
      invalid,
      save,
      saved,
      saving,
    }}>
      {props.children}
    </Context.Provider>
  );
}
