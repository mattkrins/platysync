import { useContext } from "react";
import useFetch, { Options, Returns } from "./useFetch"
import AppContext from "../providers/AppContext";
import { notifications } from "@mantine/notifications";
import { UseFormReturnType } from "@mantine/form";

interface APIOptions<returnType, sendType> extends Options<returnType, sendType> {
    /** @type {boolean} false: Do not show error notifications. */
    noError?: boolean;
    /** @type {boolean} false: Do not send authorization headers. */
    noAuth?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form?: UseFormReturnType<any>;
}

export default function useAPI<returnType = unknown, sendType = unknown>({noError, noAuth, form, catch: cat, before, ...options}: APIOptions<returnType, sendType> = {}): Returns<returnType> {
    const { logout, session } = useContext(AppContext);
    return useFetch<returnType, sendType>({
        ...options,
        catch: (message, options, error, validation) => {
            if (cat) cat(message, options, error);
            if (!noAuth && ((error.response||{}).status||400) === 401) logout();
            if (!noError && !validation) notifications.show({ title: "Error", message, color: 'red', });
            if (validation && form) form.setErrors(validation);
        },
        before: (opt1) => {
            if (before) opt1 = before(opt1) as Options<returnType, sendType>;
            return noAuth ? opt1 : { ...opt1, headers: { Authorization : `Bearer ${session}`, ...(opt1.headers||{}) }, };
        }
    });
}
