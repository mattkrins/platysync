import { useContext } from "react";
import useFetch, { options } from "./useFetch2"
import AppContext from "../providers/GenericProvider";
import { notifications } from "@mantine/notifications";

export default function useAPI(options: options = {}, handleErrors = true, useAuth = true) {
    const { logout, session } = useContext(AppContext);
    return useFetch({
        ...options,
        catch: (message, {catch: cat, ...options}, error, validation) => {
            if (cat) cat(message, options, error);
            if (useAuth && (error.status||400) === 401) logout();
            if (handleErrors && !validation) notifications.show({ title: "Error", message, color: 'red', });
        },
        before: ({before, ...opt1}) => {
            if (before) opt1 = before(opt1);
            return useAuth ? { ...opt1, headers: { Authorization : `Bearer ${session}`, ...opt1.headers }, } : opt1;
        }
    });
}
