/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from 'react'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';


export interface FetchProps extends AxiosRequestConfig {
  fetch?: boolean;
  cleanup?: boolean;
  preserve?: boolean;
  load?: boolean;
  method?: 'get'|'post'|'put'|'delete';
  clearErrors?: boolean;
  default?: unknown;
  require?: string[];
  check?: (props: { promise: Promise<unknown>, [key: string]: unknown }) => boolean;
  before?: (props: any) => void;
  modify?: (props: any) => object;
  furl?: (props: any) => string;
  fdata?: (props: any) => object;
  mutate?: (retData: any) => unknown;
  then?: (retData: any) => unknown;
  catch?: (retData: any) => unknown;
  finally?: (retData: unknown) => unknown;
  [key: string]: unknown;
}

interface Exports {
    loading: boolean;
    response: unknown|undefined;
    data: any|undefined;
    error: string|undefined;
    invalid: object|undefined;
    request: FetchProps;
    fetch(options?: object): any;
    get(options?: object): any;
    post(options?: object): any;
    put(options?: object): any;
    del(options?: object): any;
    reset(): void;
    setData(data: unknown): void;
}

interface eResponse {
    message?: string,
    response: {
        status: number;
        data: {
            error?: string,
            message?: string,
            validation?: object
        }
    }
}

export default function useFetch( props : FetchProps = {} ) {
    const [loading, setloading] = useState<boolean>(props.fetch || false);
    const [error, setError] = useState<string|undefined>(undefined);
    const [invalid, setValidatiors] = useState<object|undefined>(undefined);
    const [response, setResponse] = useState<unknown|undefined>(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<typeof props.default|undefined>(props.default || undefined);
    const [request, setRequest] = useState<any|object>({});
    const url = new URL(window.location.href);
    const axiosOptions = { baseURL: `http://${url.hostname}:2327/api/v1`, method: 'get' };
    const axiosClient = axios.create(axiosOptions);
    const reset = useCallback(() => {
        setError(undefined);
        setValidatiors(undefined);
        setResponse(undefined);
        setData(props.default || undefined);
        setRequest({});
    }, [ props ])
    const fetch = useCallback((params: FetchProps = {}) => {
        let options = {...props, ...params};
        options.url = (props.url || "") + (options.append_url || "");
        let resolve: (value: unknown) => void;
        let reject: (reason?: unknown) => void;
        const promise = new Promise(function(res, rej){
            resolve = res;
            reject = rej;
        });
        if (!options.preserve) reset();
        if (options.before) options.before({...options, promise });
        if (options.furl) options.url = options.furl(options);
        if (options.fdata) options.data = options.fdata(options);
        if (options.modify) options = {...options, ...options.modify({...options, promise }) };
        if (options.check) if (options.check({...options, promise })) return;
        setRequest(options);
        setloading(true);
        if (options.require) for (const i in (options.require)) { if (!options.require[i]) return; }
        axiosClient( options )
        .then((res: AxiosResponse) => {
            setResponse(res);
            let retData = res.data || res;
            if (options.mutate) retData = options.mutate(retData);
            if (retData) setData(retData);
            if (options.then) options.then(retData);
            resolve(retData);
        })
        .catch( (err: eResponse) => {
            let error = "Unknown Error";
            let validation = undefined;
            if (err.message) error = err.message;
            if (err.response) if (err.response.data) if (err.response.data.error) error = err.response.data.error;
            if (err.response) if (err.response.data) if (err.response.data.message) error = err.response.data.message;
            if (err.response) if (err.response.data) if (err.response.data.validation) validation = err.response.data.validation;
            if (!validation) setError(error);
            if (validation) setValidatiors(validation);
            if (options.catch) options.catch({error, validation, status: err.response.status });
            reject({error, validation });
        }).finally(()=>{
            setloading(false);
            if (options.finally) options.finally({...options, promise });
            if (options.cleanup) reset();
        }); return promise;
    }, [axiosClient, props, reset]);
    useEffect(()=>{
        if (props.require) for (const i in (props.require)) { if (!props.require[i]) return; }
        if (props.fetch) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const post = (params: FetchProps = {}) => fetch({...params, method: "post"});
    const put = (params: FetchProps = {}) => fetch({...params, method: "put"});
    const get = (params: FetchProps = {}) => fetch({...params, method: "get"});
    const del = (params: FetchProps = {}) => fetch({...params, method: "delete"});

    const exports: Exports = {
        fetch,
        post,
        put,
        get,
        del,
        reset,
        setData,
        loading,
        request,
        response,
        data,
        error,
        invalid
    };
    return (
        exports
    );
}
