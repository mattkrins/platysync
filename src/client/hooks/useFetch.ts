import { useCallback, useEffect, useState } from "react";
import axios, { AxiosResponse, AxiosRequestConfig, AxiosError } from 'axios';

export interface Options<returnType = unknown, sendType = unknown> extends AxiosRequestConfig {
    /** @type {string}: Fetch target. */
    url?: string;
    /** @type {string}: Append to URL. */
    append?: string;
    /** @type {string}: Prepend to URL. */
    prepend?: string;
    /** @type {unknown} POST data. */
    data?: sendType;
    /** @type {unknown} Default data. */
    default?: returnType;
    /** @type {boolean} Fetch upon component mount. */
    fetch?: boolean;
    /** @type {boolean} Preserve options on fetch. */
    preserve?: boolean;
    /** @type {number} Reset after x milliseconds. */
    resetAfter?: number;
    /** @param {Options} options Runs before sending. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    before?(options: Options<returnType, sendType>): any;
    /** @param {Options} options Return true to halt fetch. */
    validate?(options: Options<returnType, sendType>): boolean|undefined|void;
    /** @param {unknown} data Mutate returned data. */
    mutate?(data: unknown): returnType;
    /** Mutate request options before sending.
     * @param {Options} options Initial & inline options combined.
     * @param {Options} opt2 Inline options.
    */
    mutateReq?(options: Options<returnType, sendType>, opt2?: Options<returnType, sendType>, inline?: Options<returnType, sendType>): Options<returnType, sendType>;
    /** POST data will be set as the returned value. */
    sendData?(): sendType;
    /** @param {sendType} data Mutate POST data before sending. */
    mutateData?(data: sendType): sendType;
    /** @param {returnType} data Executes on success. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then?(data: returnType, options: Options<returnType, sendType>): any;
    /** Executes on failure.
     * @param {string} message Error message.
     * @param {Options} options Request options.
    */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch?(message: string, errors: unknown, response: AxiosError|undefined, options: Options<returnType, sendType>): any;
    /** @param {Options} options Executes on success or failure. */
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     finally?(options: Options<returnType, sendType>): any;
    [key: string]: unknown;
}

export interface fetchReturn<returnType = unknown, sendType = unknown> {
    /** @param {Options} options Executes the request. */
    fetch: (inline?: Options<returnType, sendType>) => Promise<returnType>;
    /** @param {Options} options Executes the request with POST method. */
    post: (inline?: Options<returnType, sendType>) => Promise<returnType>;
    /** @param {Options} options Executes the request with PUT method. */
    save: (inline?: Options<returnType, sendType>) => Promise<returnType>;
    /** @param {Options} options Executes the request with PUT method. */
    put: (inline?: Options<returnType, sendType>) => Promise<returnType>;
    /** @param {Options} options Executes the request with GET method. */
    get: (inline?: Options<returnType, sendType>) => Promise<returnType>;
    /** @param {Options} options Executes the request with DELETE method. */
    del: (inline?: Options<returnType, sendType>) => Promise<returnType>;
    /** Sets the data state.
     * @param {returnType} data */
    setData: (data: returnType|React.SetStateAction<returnType>)=>void;
    /** Sets the data state.
     * @param {returnType} data */
    set: (data: returnType|React.SetStateAction<returnType>)=>void;
    /** Sets the error state.
     * @param {string} error */
    setError: (data: string|undefined|React.SetStateAction<string|undefined>)=>void;
    /** Reset the request to its initial state. */
    reset: ()=>void;
    /** Mutates / modifies response data before calling then(mutated_data)
     * @param {string} error */
    mutate: (mutation: {[k: string]: unknown})=>void;
    request: Options<returnType>;
    /** AxiosResponse object. */
    response: AxiosResponse|undefined;
    /** Response data, can be initialized with the 'default' param */
    data: returnType;
    /** Is the request loading? */
    loading: boolean;
    /** Defined if the response an error */
    error: string|undefined;
    /** Defined if the response data contained an error key */
    errors: unknown|undefined;
}

class Deferred<returnType = unknown> {
    public promise: Promise<returnType>;
    public reject: (reason?: string) => void = () => void {};
    public resolve: (value: returnType) => void = () => void {};
    constructor() { this.promise = new Promise((resolve, reject) => { this.reject = reject; this.resolve = resolve; });}
}

/**
 * Axios request hook with advanced state management.
 * @author MattKrins
 * @see {@link https://github.com/mattkrins/}
 * 
 * @param {Options} opt1 { url, data, default, then, catch, mutate, ...etc }
 * @returns {fetchReturn} { data, loading, error, get, post, del, reset, ...etc }
 */
export default function useFetch<returnType = unknown, sendType = unknown>(opt1: Options<returnType, sendType> = { method: 'get', url: "/" }): fetchReturn<returnType, sendType> {
    const [request, setRequest] = useState<Options<returnType, sendType>>(opt1);
    const [response, setResponse] = useState<AxiosResponse|undefined>(undefined);
    const [data, setData] = useState<returnType>((opt1.default||undefined) as returnType);
    const [loading, setLoading] = useState<boolean>(opt1.fetch || false);
    const [error, setError] = useState<string|undefined>(undefined);
    const [errors, setErrors] = useState<unknown|undefined>(undefined);
    const reset = useCallback(() => {
        setRequest(opt1);
        setData((opt1.default||undefined) as returnType);
        setResponse(undefined);
        setError(undefined);
        setErrors(undefined);
    }, [ opt1 ]);
    const execute = useCallback(async (inline: Options<returnType, sendType> = {}): Promise<returnType> => {
        let options = { ...opt1, ...inline } as Options<returnType, sendType>;
        if (options.append) options.url = `${options.url}${options.append}`;
        if (options.prepend) options.url = `${options.prepend}${options.url}`;
        const deferred = new Deferred<returnType>();
        if (options.validate && options.validate(options)){ return deferred.promise as Promise<returnType>;}
        if (options.before) options.before(options);
        try {
            if (options.mutateReq) options = options.mutateReq(options, inline) as Options<returnType, sendType>;
            if (options.sendData) options.data = options.sendData() as sendType;
            if (options.mutateData) options.data = options.mutateData(options.data as sendType) as sendType;
            if (!options.preserve) reset();
            if (!options.preserveErrors) setError(undefined);
            setLoading(true);
            const res = await axios(options.url||"", options);
            setResponse(res);
            let data = res.data as returnType;
            if (options.mutate) data = options.mutate(data) as returnType;
            setData(data);
            if (options.then) options.then(data, options);
            deferred.resolve(data);
        } catch (e) {
            const err = e as AxiosError<{ errors: { [k: string]: string }, message?: string, error?: string }>;
            const message = (err?.response?.data?.message) ? err.response.data.message : (err?.response?.data?.error) ? err.response.data.error : err.message || "Unknown Error";
            setError(message);
            if (err?.response?.data) setErrors(err?.response?.data.errors);
            if (options.catch) options.catch(message, err?.response?.data.errors, err?.response as unknown as AxiosError, options);
            if (!options.catch) deferred.reject(message);
        } finally {
            if (options.finally) options.finally(options);
            setLoading(false);
            if (options.resetAfter) setTimeout(reset, options.resetAfter||1000);
        }
        return deferred.promise as Promise<returnType>;
    }, [opt1, reset]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (opt1.fetch) execute(); }, [ opt1.fetch ]);
    const mutate = (mutation: {[k: string]: unknown}) => setData(data=>({...data, ...mutation}));
    return {
        fetch: execute,
        post: (o: Options<returnType, sendType> = {}) => execute({ ...o, method: "post" }),
        save: (o: Options<returnType, sendType> = {}) => execute({ ...o, method: "put" }),
        put: (o: Options<returnType, sendType> = {}) => execute({ ...o, method: "put" }),
        get: (o: Options<returnType, sendType> = {}) => execute({ ...o, method: "get" }),
        del: (o: Options<returnType, sendType> = {}) => execute({ ...o, method: "delete" }),
        setData, set: setData, setError,
        reset, mutate,
        request, response, data,
        loading, error, errors,
    }
}