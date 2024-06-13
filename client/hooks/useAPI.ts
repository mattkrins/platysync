import { UseFormReturnType } from "@mantine/form";
import useFetch, { Options, fetchReturn } from "./useFetch";
import { useLocation } from "wouter";
import { AxiosError } from "axios";

interface APIOptions<returnType, sendType> extends Options {
    form?: UseFormReturnType<any>;
    noAuth?: boolean;
}

export default function useAPI<returnType = unknown, sendType = unknown>({form, noAuth, catch: c, ...options}: APIOptions<returnType, sendType> = { method: 'get', url: "/" }): fetchReturn<returnType, sendType> {
    const [_, setLocation] = useLocation();
    if (form){
        options.data = form.values;
        options.validate = () => { form.validate(); return !form.isValid(); };
        c = (_, errors) => form.setErrors(errors as {});
    }
    options.catch = (message: string, errors: unknown, response: AxiosError, options: APIOptions<returnType, sendType>) => {
        if (!noAuth && response && response.status === 401) setLocation("/logout");
        if (c) c(message, errors, response, options);
    };
    return useFetch<returnType, sendType>( options as Options<returnType, sendType> );
}