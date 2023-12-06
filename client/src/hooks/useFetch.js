import { useState, useCallback, useEffect } from 'react'
import axios from 'axios';

export default function useFetch( props = {} ) {
    const [loading, setloading] = useState(props.fetch || false);
    const [request, setRequest] = useState(props);
    const [error, setError] = useState(false);
    const [errors, setErrors] = useState(false);
    const [invalid, setValidatiors] = useState({});
    const [response, setResponse] = useState(undefined);
    const [data, setData] = useState(props.default);
    const axiosOptions = { baseURL: 'http://localhost:7870/api/', method: 'get' };
    const axiosClient = axios.create(axiosOptions);
    const reset = useCallback((loading) => {
        setloading(loading || false);
        setRequest( props );
        setError(false);
        setErrors(false);
        setValidatiors({});
        setResponse(undefined);
        setData(props.default);
    }, [ props ])
    const fetch = useCallback((params={}) => {
        const options = {...props, ...params};
        const promises = [];
        const promise = new Promise(function(resolve, reject){ promises.push({resolve, reject}); });
        if (options.before) if (options.before({...options, promise: promises[0] })) return;
        if (options.reset !== false){ reset(true); } else {
            setloading(options.fetch || options.fetch || options.load);
            if (options.clearErrors) { setError(false); setErrors(false); setValidatiors({}); }
        }
        for (const i in (options.require || [])) { if (!options.require[i]) return; }
        setRequest( options );
        axiosClient( options )
        .then( (res) => {
            setResponse(res);
            let retData = res.data || res;
            if (options.mutate) retData = options.mutate(retData);
            if (retData) setData(retData);
            if (options.then) options.then(retData);
            promises[0].resolve(retData);
        })
        .catch( (err) => {
            console.error(err);
            const res =
            err.response ? (
            err.response.statusText ?
            err.response.statusText :
            err.response.data ?
            String(err.response.data) :
            err.message ?
            err.message :
            "Unknown Error" ) :
            "Unknown Error";
            setError(res);
            setErrors(
                err.response ? (
                err.response.data ?
                err.response.data :
                [ res ] ) :
                [ res ]
            );
            if (err.response.data && Array.isArray(err.response.data)){
                const object = err.response.data.reduce((obj, item) => (obj[item.path] = item.message, obj) ,{});
                setValidatiors(object);
            }
            if (options.catch) options.catch(res);
            promises[0].reject(res);
        }).finally(()=>{
            setloading(false);
            if (options.finally) options.finally({...options, promise: promises[0] });
            if (options.cleanup) reset(false);
        }); return promise;
    }, [axiosClient, props, reset]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(()=>{
        for (const i in (props.require || [])) { if (!props.require[i]) return; }
        if (props.fetch) fetch();
    }, []);

    return (
        {
            fetch,
            reset,
            setData,
            loading,
            response,
            data,
            error,
            errors,
            invalid,
            request
        }
    );
}
