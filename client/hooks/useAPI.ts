import { UseFormReturnType } from "@mantine/form";
import useFetch, { Options, fetchReturn } from "./useFetch";
import { useLocation } from "wouter";
import { AxiosError } from "axios";
import { useMemo } from "react";

interface APIOptions<returnType, sendType> extends Options<returnType, sendType> {
    form?: UseFormReturnType<any>;
    noAuth?: boolean;
}

export default function useAPI<returnType = unknown, sendType = unknown>({form, noAuth, catch: c, data, ...options}: APIOptions<returnType, sendType> = { method: 'get', url: "/" }): fetchReturn<returnType, sendType> {
    const [_, setLocation] = useLocation();
    const mutatedOptions = useMemo(() => {
        if (form) {
            data = {...form.values, ...data} as sendType;
            options.validate = () => { form.validate(); return !form.isValid(); };
            c = (_, errors) => form.setErrors(errors as {});
        }
        options.data = data as sendType;
        options.catch = (message: string, errors: unknown, response: AxiosError, options: APIOptions<returnType, sendType>) => {
            if (!noAuth && response && response.status === 401) setLocation("/logout");
            if (c) c(message, errors, response, options);
        };
        return options;
    }, [form, noAuth, c, data, options]);
    return useFetch<returnType, sendType>(mutatedOptions);
}