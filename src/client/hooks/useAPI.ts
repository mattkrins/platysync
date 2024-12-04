import { UseFormReturnType } from "@mantine/form";
import useFetch, { Options, fetchReturn } from "./useFetch";
import { useLocation } from "wouter";
import { AxiosError } from "axios";
import { useMemo } from "react";
import { useSelector } from "./redux";
import { getName } from "../providers/schemaSlice";

interface APIOptions<returnType, sendType> extends Options<returnType, sendType> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form?: UseFormReturnType<any>;
    noAuth?: boolean;
    schema?: boolean;
}

interface APIReturn<returnType = unknown, sendType = unknown> extends fetchReturn<returnType, sendType> {
    schema_name: string;
}

export default function useAPI<returnType = unknown, sendType = unknown>({form, noAuth, schema, catch: c, data, ...options}: APIOptions<returnType, sendType> = { method: 'get', url: "/" }): APIReturn<returnType, sendType> {
    const [_, setLocation] = useLocation();
    const schema_name = useSelector(getName);
    const mutatedOptions = useMemo(() => {
        options.url = schema ? `/api/v1/schema/${schema_name}${options.url}` : `/api/v1${options.url}`;
        if (form) {
            data = {...form.values, ...data} as sendType;
            options.validate = () => { form.validate(); return !form.isValid(); };
            // eslint-disable-next-line @typescript-eslint/no-empty-object-type
            c = (_, errors) => form.setErrors(errors as {});
        }
        options.data = data as sendType;
        options.catch = (message: string, errors: unknown, response: AxiosError, options: APIOptions<returnType, sendType>) => {
            if (!noAuth && response && response.status === 401) setLocation("/logout");
            if (c) c(message, errors, response, options);
        };
        return options;
    }, [form, noAuth, c, data, schema, options]);
    const returns = useFetch<returnType, sendType>(mutatedOptions);
    return { ...returns, schema_name };
}