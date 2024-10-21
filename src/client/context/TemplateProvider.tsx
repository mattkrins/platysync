import { useDisclosure } from "@mantine/hooks";
import { openExplorerProps, TemplateContext } from "./TemplateContext";
import { useCallback, useMemo, useState } from "react";
import { useSelector } from "../hooks/redux";
import { compile, pathHelpers, ruleHelpers } from "../modules/handlebars";
import { getDictionary, getSecrets } from "../providers/appSlice";
import { getFiles, getsDictionary, getsSecrets } from "../providers/schemaSlice";

type key = {[k: string]: string}

function useTemplate({}){
    const files = useSelector(getFiles);
    const sdict = useSelector(getsDictionary);
    const ssec = useSelector(getsSecrets);
    const gdict = useSelector(getDictionary);
    const gsec = useSelector(getSecrets);
    const template = useMemo(()=>{
        const head: {[k: string]: key|string } = { $file: {}, $rule: {}, $path: {}, $sdict: {}, $ssec: {}, $gdict: {}, $gsec: {} };
        for (const { key } of pathHelpers) (head.$path as key)[key] = "1";
        for (const { key } of ruleHelpers) (head.$rule as key)[key] = "1";
        for (const { name, key } of files) (head.$file as key)[(key||name)] = "1"
        for (const { key } of sdict) (head.$sdict as key)[key] = "1";
        for (const { key } of ssec) (head.$ssec as key)[key] = "1";
        for (const { key } of gdict) (head.$gdict as key)[key] = "1";
        for (const { key } of gsec) (head.$gsec as key)[key] = "1";
    //    for (const {name, headers} of contextualised){
    //        if (!head[name]) head[name] = {};
    //        for (const header of headers) (head[name] as {[k: string]: string})[header] = header;
    //    }
        return head;
    }, [ files, sdict, ssec, gdict, gsec ]);
    const validate = useCallback((value = '')=>{
      let error: string|undefined;
      try { compile(value)(template); }
      catch (e) { error = (e as {message: string}).message; }
      return error;
    }, [ template ])
    return { template, validate };
  }

export default function TemplateProvider ({ children }: { children: JSX.Element }) {
    const { validate, template } = useTemplate({});
    const [opened, handlers] = useDisclosure(false);
    const [input, setInput] = useState<HTMLInputElement>();
    const [scope, setScope] = useState<string[]>([]);
    const inRule = scope.includes("rule");
    const open = (input?: openExplorerProps) => {
        if (input?.input) setInput(input.input);
        if (input?.scope) setScope(input.scope);
        handlers.open();
    }
    const close = () => {
        setInput(undefined);
        setScope([]);
        handlers.close();
    }

    return <TemplateContext.Provider value={
        {
            opened,
            open,
            close,
            setInput,
            input,
            scope,
            inRule,
            validate,
            template,
        }
    }>{children}</TemplateContext.Provider>;
};
