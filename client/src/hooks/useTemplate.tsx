import { ActionIcon, Button, Tooltip } from "@mantine/core";
import { IconCode, IconAlertCircle } from "@tabler/icons-react";
import { compile } from "../modules/handlebars";
import { useCallback, useContext, useMemo } from "react";
import SchemaContext from "../providers/SchemaContext";
import useAPI from "./useAPI";

interface getInputProps {
  error?: string;
  value?: string;
}

export type templateProps = (onClick?: React.MouseEventHandler<HTMLButtonElement>, getInputProps?: getInputProps | undefined ) => {
  error: boolean;
  value?: string | undefined;
  rightSection: JSX.Element | undefined;
}

export default function useTemplate( sources: string[] = [], templates: string[] = [] ): [ templateProps ] {
  const { headers, schema } = useContext(SchemaContext);
  
  const { data: files } = useAPI({
      url: `/schema/${schema?.name}/storage`,
      default: [],
      fetch: true
  });

  const template = useMemo(()=>{
    const head: {[k: string]: {[k: string]: string}|string } = { $file: {} };
    for (const name of Object.keys(headers)){
      if (!sources.includes(name)) continue;
      head[name] = head[name]||{};
      for (const key of headers[name]) (head[name] as {[k: string]: string})[key] = key;
    }
    for (const file of files) (head.$file as {[k: string]: string})[file.name] = file.name;
    for (const t of templates) head[t] = t;
    return head;
  }, [ headers, sources, templates, files ]);


  const templateProps = useCallback((onClick?: React.MouseEventHandler<HTMLButtonElement>, getInputProps?: getInputProps )=>{
    let error: string|boolean = getInputProps?.error||false;
    try {
        compile(getInputProps?.value||"")(template);
    } catch (e) {
        error = (e as {message: string}).message;
    }
    const explorer = <ActionIcon onClick={onClick} variant="subtle" ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }} /></ActionIcon>;
    const rightSection = error ?
    <Button.Group style={{marginRight:30}} >
        <Tooltip withArrow label={error} w={220} multiline position="top-end" color="red" ><IconAlertCircle stroke={1.5} color="red" /></Tooltip>
        {explorer}
    </Button.Group> : explorer;

    return {
        rightSection: onClick ? rightSection : undefined,
        ...getInputProps,
        error: !!error
    };

  }, [ template ]);


  return ([ templateProps ]);

}