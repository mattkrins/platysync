import { useCallback, useEffect, useState } from "react";
import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';

type key = string|number;
type validation = {[k:string]: string};
export interface options extends AxiosRequestConfig {
    url?: string;
    data?: unknown;
    fetch?: boolean;
    preserve?: boolean;
    cleanup?: boolean;
    key?: key;
    modify?(data: unknown): unknown;
    before?(options: options, opt2?: options): options;
    mutate?(data: unknown): unknown;
    then?(data: unknown): unknown;
    catch?(message: string, options: options, error: AxiosError, validation?: validation): void;
    finally?(options: options): void;
}

function prom(): Promise<{ promise: Promise<unknown>, resolve: (value: unknown) => void, reject: (reason: unknown) => void }> {
    return new Promise(function(res1){
        const promise: Promise<unknown> = new Promise((resolve, reject) => res1({ promise, resolve, reject }) );
    });
}

export default function useFetch( opt1: options = {} ) {
    const url = new URL(window.location.href);
    const axiosOptions = { baseURL: `http://${url.hostname}:2327/api/v1`, method: 'get' };
    const [request, setRequest] = useState<options>(opt1);
    const [response, setResponse] = useState<AxiosResponse<unknown,unknown>|undefined>(undefined);
    const [data, setData] = useState<unknown|undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(opt1.fetch || false);
    const [loaders, setLoaders] = useState<{[k:key]: boolean}>({});
    const [error, setError] = useState<string|undefined>(undefined);
    const [errors, setErrors] = useState<validation>({});
    const axiosClient = axios.create(axiosOptions);
    const reset = useCallback((options: options = {}) => {
        setRequest(options);
        setResponse(undefined);
        setError(undefined);
        setErrors({});
    }, [ opt1 ]);
    const fetch = useCallback( async ( opt2: options = {} ) => {
        const { promise, resolve, reject } = await prom();
        let options = { ...opt1, ...opt2 };
        try {
            if (options.before) options = options.before(options, opt2);
            if (options.modify) options.data = options.modify(options.data);
            if (!options.preserve) reset(options);
            if (options.key) setLoaders(loaders=>({...loaders, [options.key as key]: true}));
            setLoading(true);
            const response = await axiosClient( options );
            setResponse(response);
            let data = (response.data || response) as unknown;
            if (options.mutate) data = options.mutate(data);
            setData(data);
            if (options.then) options.then(data);
            resolve(data);
        } catch (e) {
            const err = e as AxiosError;
            const data = (err.response||{data:{}}).data as { error?: string, message?: string, validation?: validation };
            const message = data.message || data.error || err.message || "Unknown Error";
            if (data.validation) setErrors(data.validation);
            setError(message);
            if (options.catch) options.catch(message, options, err, data.validation);
            reject(message);
        } finally {
            setLoading(false);
            if (options.key) setLoaders(loaders=>{delete loaders[options.key as key]; return loaders; });
            if (options.finally) options.finally(options);
            if (options.cleanup) reset(options);
        }
        return promise;
    }, [ opt1 ]);
    useEffect(()=>{ if (opt1.fetch) fetch(); }, []);
    return {
        fetch,
        post: (o: options = {}) => fetch({...o, method: "post"}),
        save: (o: options = {}) => fetch({...o, method: "put"}),
        put: (o: options = {}) => fetch({...o, method: "put"}),
        get: (o: options = {}) => fetch({...o, method: "get"}),
        del: (o: options = {}) => fetch({...o, method: "delete"}),
        reset,
        setData,
        set: setData,
        request,
        response,
        data,
        loading,
        loaders,
        error,
        errors, 
    }
}
