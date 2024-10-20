import { compile } from "handlebars";
import { useMemo, useCallback } from "react";
import { pathHelpers, ruleHelpers } from "../modules/handlebars";
import { getDictionary, getSecrets } from "../providers/appSlice";
import { getFiles, getsDictionary, getsSecrets } from "../providers/schemaSlice";
import { useSelector } from "./redux";

interface templateProps {
  rule?: object;
}

type key = {[k: string]: string}
export default function useTemplate({}: templateProps){
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