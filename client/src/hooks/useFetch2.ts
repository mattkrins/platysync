import { useCallback, useEffect, useState } from "react";
import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';

type key = string | number;
type validation = { [k: string]: string };
export interface Options<returnType = unknown, sendType = unknown> extends AxiosRequestConfig {
    /** @type {string}: Fetch target. */
    url?: string;
    /** @type {unknown} undefined: POST data. */
    data?: sendType;
    /** @type {unknown} undefined: Default data. */
    default?: returnType;
    /** @type {boolean} false: Fetch upon component mount. */
    fetch?: boolean;
    /** @type {boolean} true: Preserve options on fetch. */
    preserve?: boolean;
    /** @type {boolean} true: Preserve error/s on fetch. */
    preserveErrors?: boolean;
    /** @type {boolean} false: Preserve options after fetch. */
    cleanup?: boolean;
    /** @type {string|number}: Field key for loaders & validation. */
    key?: key;
    /** @type {string}: Append to URL. */
    append?: string;
    /** @param {sendType} data Mutate POST data before sending. */
    modify?(data: sendType): sendType;
    /** @param {Options} options Return true to halt fetch. */
    check?(options: Options<returnType, sendType>): boolean|undefined|void;
    /** Mutate options before sending.
     * @param {Options} options Initial & inline options combined.
     * @param {Options} opt2 Inline options.
    */
    before?(options: Options<returnType, sendType>, opt2?: Options<returnType>): Options<returnType>;
    /** @param {unknown} data Mutate return data. */
    mutate?(data: unknown): returnType;
    /** @param {returnType} data Executes on success. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then?(data: returnType, options: Options<returnType, sendType>, key?: key): any;
    /** Executes on failure.
     * @param {string} message Error message.
     * @param {Options} options Request options.
     * @param {AxiosError} error Axios error object.
     * @param {validation} validation Validation error object.
    */
    catch?(message: string, options: Options<returnType, sendType>, error: AxiosError, validation?: validation): void;
    /** @param {Options} options Executes on success or failure. */
    finally?(options: Options<returnType, sendType>): void;
    [key: string]: unknown;
}
export interface Returns<returnType = unknown> {
    fetch: (opt2?: Options<returnType>) => Promise<returnType>;
    post: (opt2?: Options<returnType>) => Promise<returnType>;
    save: (opt2?: Options<returnType>) => Promise<returnType>;
    put: (opt2?: Options<returnType>) => Promise<returnType>;
    get: (opt2?: Options<returnType>) => Promise<returnType>;
    del: (opt2?: Options<returnType>) => Promise<returnType>;
    setData: (data: returnType|React.SetStateAction<returnType>)=>void;
    set: (data: returnType|React.SetStateAction<returnType>)=>void;
    setLoaders: React.Dispatch<React.SetStateAction<{ [k: key]: boolean|undefined }>>
    reset: ()=>void;
    mutate: (mutation: {[k: string]: unknown})=>void;
    request: Options<returnType>;
    response: AxiosResponse<unknown, unknown>|undefined;
    data: returnType;
    loading: boolean;
    loaders: { [k: key]: boolean|undefined };
    error: string|undefined;
    errors: validation;
}

class Deferred {
    public promise: Promise<unknown>;
    public reject: (reason?: string) => void = () => void {};
    public resolve: (value: unknown) => void = () => void {};
    constructor() { this.promise = new Promise((resolve, reject) => { this.reject = reject; this.resolve = resolve; });}
}

export default function useFetch<returnType = unknown, sendType = unknown>(opt1: Options<returnType, sendType> = {}): Returns<returnType> {
    const url = new URL(window.location.href);
    const axiosOptions = { baseURL: `http://${url.hostname}:2327/api/v1`, method: 'get' };
    const [request, setRequest] = useState<Options<returnType, sendType>>(opt1);
    const [response, setResponse] = useState<AxiosResponse<unknown, unknown>|undefined>(undefined);
    const [data, setData] = useState<returnType>(opt1.default as returnType);
    const [loading, setLoading] = useState<boolean>(opt1.fetch || false);
    const [loaders, setLoaders] = useState<{ [k: key]: boolean|undefined }>({});
    const [error, setError] = useState<string|undefined>(undefined);
    const [errors, setErrors] = useState<validation>({});
    const axiosClient = axios.create(axiosOptions);
    const reset = useCallback((options: Options<returnType, sendType> = {}) => {
        setRequest(options);
        setResponse(undefined);
        setData(options.default as returnType);
        if (!options.preserveErrors){ setError(undefined); setErrors({}); }
    }, [opt1]);
    const fetch = useCallback(async (opt2: Options<returnType> = {}): Promise<returnType> => {
        let options = { ...opt1, ...opt2 } as Options<returnType, sendType>;
        const deferred = new Deferred();
        if (options.check && options.check(options)){ return deferred.promise as Promise<returnType>;}
        try {
            if (options.before) options = options.before(options, opt2) as Options<returnType, sendType>;
            if (options.modify) options.data = options.modify(options.data as sendType) as sendType;
            if (!options.preserve) reset(opt1 as Options<returnType, sendType>);
            if (!options.preserveErrors){ setError(undefined); setErrors({}); }
            if (typeof options.key !== "undefined") setLoaders(loaders => ({ ...loaders, [options.key as key]: true }));
            if (options.append) options.url += options.append;
            setLoading(true);
            const response = await axiosClient(options);
            setResponse(response);
            let data = (response.data || response) as returnType;
            if (options.mutate) data = options.mutate(data) as returnType;
            setData(data);
            if (options.then) options.then(data, options, options.key);
            deferred.resolve(data);
        } catch (e) {
            const err = e as AxiosError;
            const data = (err.response || { data: {} }).data as { error?: string, message?: string, validation?: {validation: validation} };
            const message = data.message || data.error || err.message || "Unknown Error";
            if (data.validation){
                if (typeof options.key !== "undefined"){
                    setErrors({[options.key]: JSON.stringify(data.validation.validation||data.validation) })} else {
                    setErrors(data.validation.validation||data.validation);
                }
            }
            if (!data.validation) setError(message);
            if (options.catch) options.catch(message, options, err, data.validation?data.validation.validation||data.validation:undefined);
            if (!options.catch) deferred.reject(message);
        } finally {
            setLoading(false);
            if (typeof options.key !== "undefined") setLoaders(loaders => { delete loaders[options.key as key]; return loaders; });
            if (options.finally) options.finally(options);
            if (options.cleanup) reset(opt1 as Options<returnType, sendType>);
        }
        return deferred.promise as Promise<returnType>;
    }, [opt1]);
    useEffect(() => { if (opt1.fetch) fetch(); }, []);
    const mutate = (mutation: {[k: string]: unknown}) => setData(data=>({...data, ...mutation}));
    return {
        fetch,
        post: (o: Options<returnType> = {}) => fetch({ ...o, method: "post" }),
        save: (o: Options<returnType> = {}) => fetch({ ...o, method: "put" }),
        put: (o: Options<returnType> = {}) => fetch({ ...o, method: "put" }),
        get: (o: Options<returnType> = {}) => fetch({ ...o, method: "get" }),
        del: (o: Options<returnType> = {}) => fetch({ ...o, method: "delete" }),
        setData,
        set: setData,
        setLoaders,
        reset,
        mutate,
        request,
        response,
        data,
        loading,
        loaders,
        error,
        errors,
    }
}
