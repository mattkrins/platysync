import { useDisclosure } from "@mantine/hooks";
import { openExplorerProps, TemplateContext } from "./TemplateContext";
import { useCallback, useMemo, useState } from "react";
import { useConnectors, useSelector } from "../hooks/redux";
import { compile, pathHelpers, ruleHelpers } from "../modules/handlebars";
import { getDictionary, getSecrets } from "../providers/appSlice";
import { getFiles, getsDictionary, getsSecrets } from "../providers/schemaSlice";

type key = {[k: string]: string}

function useTemplate({ rule }: { rule?: Rule }){
    const files = useSelector(getFiles);
    const sdict = useSelector(getsDictionary);
    const ssec = useSelector(getsSecrets);
    const gdict = useSelector(getDictionary);
    const gsec = useSelector(getSecrets);
    const { connectors } = useConnectors();
    const buildTemplate = useCallback((rule?: Rule)=>{
        const sources = rule?.primary ? [ rule.primary, ...(rule?.sources || []).map(s=>s.foreignName as string) ] : [];
        const ruleConnectors = connectors.filter(item => sources.includes(item.name) );
        const head: {[k: string]: key|string } = { $file: {}, $rule: {}, $path: {}, $sdict: {}, $ssec: {}, $gdict: {}, $gsec: {} };
        for (const { key } of pathHelpers) (head.$path as key)[key] = "1";
        for (const { key } of ruleHelpers) (head.$rule as key)[key] = "1";
        for (const { name, key } of files) (head.$file as key)[(key||name)] = "1"
        for (const { key } of sdict) (head.$sdict as key)[key] = "1";
        for (const { key } of ssec) (head.$ssec as key)[key] = "1";
        for (const { key } of gdict) (head.$gdict as key)[key] = "1";
        for (const { key } of gsec) (head.$gsec as key)[key] = "1";
        for (const {name, headers} of ruleConnectors){
            if (!head[name]) head[name] = {};
            for (const header of headers) (head[name] as {[k: string]: string})[header] = "1";
        }
        return head;
    }, [ files, sdict, ssec, gdict, gsec ]);
    const validate = useCallback((value = '', rule?: Rule)=>{
      let error: string|undefined;
      try { compile(value)(buildTemplate(rule)); }
      catch (e) { error = (e as {message: string}).message; }
      return error;
    }, [ buildTemplate ])
    return { buildTemplate, validate };
  }

export default function TemplateProvider ({ children }: { children: JSX.Element }) {
    const [opened, handlers] = useDisclosure(false);
    const [input, setInput] = useState<HTMLInputElement>();
    const [rule, setRule] = useState<Rule>();
    const { validate, buildTemplate } = useTemplate({ rule });
    const open = (input?: openExplorerProps) => {
        if (input?.input) setInput(input.input);
        let scope: string[] = [];
        if (input?.rule){
            scope.push('rule');
            setRule(input.rule);
        }
        if (input?.scope) scope = [...scope, ...input.scope ];
        handlers.open();
    }
    const close = () => {
        setInput(undefined);
        setRule(undefined);
        handlers.close();
    }

    return <TemplateContext.Provider value={
        {
            opened,
            open,
            close,
            setInput,
            setRule,
            input,
            rule,
            validate,
            buildTemplate,
        }
    }>{children}</TemplateContext.Provider>;
};
