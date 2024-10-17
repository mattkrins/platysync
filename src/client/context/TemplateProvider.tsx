import { useDisclosure } from "@mantine/hooks";
import { ThemeContext } from "./TemplateContext";
import { useMemo, useState } from "react";
import { pathHelpers } from "../modules/handlebars";

export default function TemplateProvider ({ children }: { children: JSX.Element }) {
    const [opened, handlers] = useDisclosure(false);
    const [input, setInput] = useState<HTMLInputElement>();
    const close = () => {
        setInput(undefined);
        handlers.close();
    }
    //const files = useSelector(getFiles);
//
    //const template = useMemo(()=>{
    //    const head: {[k: string]: {[k: string]: string}|string } = { $file: {} };
    //    for (const {key} of pathHelpers) head[key] = key;
    //    for (const {name, key} of files) (head.$file as {[k: string]: string})[(key||name)] = key||name;
    //    for (const {name, headers} of contextualised){
    //        if (!head[name]) head[name] = {};
    //        for (const header of headers) (head[name] as {[k: string]: string})[header] = header;
    //    }
    //    return head;
    //}, [ files, contextualised, inline, inRule ]);

    return <ThemeContext.Provider value={
        {
            opened,
            open: handlers.open,
            close,
            setInput,
            input,
        }
    }>{children}</ThemeContext.Provider>;
};
