import { compile } from "handlebars";
import { useMemo, useCallback } from "react";
import { pathHelpers } from "../modules/handlebars";
import { getDictionary, getSecrets } from "../providers/appSlice";
import { getFiles, getsDictionary, getsSecrets } from "../providers/schemaSlice";
import { useSelector } from "./redux";

export default function useTemplate(){
    const files = useSelector(getFiles);
    const sdict = useSelector(getsDictionary);
    const ssec = useSelector(getsSecrets);
    const gdict = useSelector(getDictionary);
    const gsec = useSelector(getSecrets);
    const template = useMemo(()=>{
        const head: {[k: string]: {[k: string]: string}|string } = { $file: {}, $sdict: {}, $ssec: {}, $gdict: {}, $gsec: {} };
        for (const {key} of pathHelpers) head[key] = key;
        for (const {name, key} of files) (head.$file as {[k: string]: string})[(key||name)] = "1"
        for (const {key} of sdict) (head.$sdict as {[k: string]: string})[key] = "1";
        for (const {key} of ssec) (head.$ssec as {[k: string]: string})[key] = "1";
        for (const {key} of gdict) (head.$gdict as {[k: string]: string})[key] = "1";
        for (const {key} of gsec) (head.$gsec as {[k: string]: string})[key] = "1";
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