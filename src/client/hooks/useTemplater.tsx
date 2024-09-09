import { ActionIcon, Box, Button, CloseButton, Code, Collapse, Drawer, Flex, Group, Text, TextInput, Title, Tooltip, UnstyledButton, useMantineTheme } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { Icon, IconAlertCircle, IconBraces, IconChevronRight, IconCode, IconFiles, IconFolderCode, IconPlug, IconProps, IconRun, IconSearch } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes, useCallback, useMemo, useState } from "react";
import { compile, genericHelpers, paths } from "../modules/handlebars";
import classes from './useTemplater.module.css';
import { useSelector } from "react-redux";
import { getFiles } from "../providers/schemaSlice";
import { useConnectors } from "./redux";

type Template = {
    [k: string]: string | { [k: string]: string };
};

function flattenTemplate(template: Template): string[] {
    const result: string[] = [];

    function flatten(obj: Template, prefix: string = '') {
        for (const key in obj) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'string') {
                result.push(newKey);
            } else {
                flatten(obj[key] as Template, newKey);
            }
        }
    }

    flatten(template);
    return result;
}

interface SectionProps {
    onClick(): void;
    open?: boolean;
    label: string;
    color?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    Ricon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
}
function Section({ onClick, open, label, color, Icon, Ricon }: SectionProps ) {
    return (
    <UnstyledButton onClick={onClick} className={classes.connector} p="xs" mt="xs" >
    <Group>
        <Box style={{ display: 'flex', alignItems: 'center' }} >
            <Icon size={17} color={color||"grey"} />
        </Box>
        <div style={{ flex: 1 }}><Text size="sm">{label}</Text></div>
        {open!==undefined&&<IconChevronRight size={17} stroke={1.5} style={{transform: open ? `rotate(${90}deg)` : 'none',}} />}
        {Ricon&&<Ricon size={17} stroke={1.5}/>}
    </Group>
    </UnstyledButton>
    )
}

export interface TemplateOptions {
    buttons?: JSX.Element;
    disabled?: boolean;
    placeholder?: string;
    value?: string;
}

export type templateProps = (form: UseFormReturnType<any>, path: string, options?: TemplateOptions) => {
    error?: boolean;
    onChange: any;
    value?: any;
    defaultValue?: any;
    checked?: any;
    onFocus?: any;
    onBlur?: any;
    rightSection?: JSX.Element;
    placeholder?: string;
}

export default function useTemplater( { names, inline }: { names?: string[], inline?: string[] } = {} ) {
    const theme = useMantineTheme();
    const [ opened, { open, close } ] = useDisclosure(false);
    const [ viewHelpers, { toggle: toggleHelpers } ] = useDisclosure(false);
    const [ viewPaths, { toggle: togglePaths } ] = useDisclosure(false);
    const [ viewInline, { toggle: toggleInline } ] = useDisclosure(false);
    const [ filter, setFilter ] = useState<string>('');
    const [ click, setClick ] = useState(() => (d: string) => {});
    const files = useSelector(getFiles);
    const { proConnectors } = useConnectors();

    const contextualised = useMemo(()=>{
        let context = proConnectors;
        if (names) context = context.filter(c=>names.includes(c.name));
        return context;
    },[ proConnectors, names ]);

    const template = useMemo(()=>{
        const head: {[k: string]: {[k: string]: string}|string } = { $file: {} };
        if (inline) for (const key of inline) head[key] = key;
        for (const {name, key} of files) (head.$file as {[k: string]: string})[(key||name)] = key||name;
        for (const {name, headers} of contextualised){
            if (!head[name]) head[name] = {};
            for (const header of headers) (head[name] as {[k: string]: string})[header] = header;
        }
        return head;
    }, [ files, contextualised ]);

    const tags = useMemo(()=>flattenTemplate(template),[ template ]);
    const filteredTags = useMemo(()=>tags.filter(item => item.toLowerCase().includes(filter.toLowerCase()) ),[ tags, filter ]);

    const templateProps: templateProps = useCallback((form: UseFormReturnType<any>, path: string, options: TemplateOptions = {}) => {
        const inputProps = form.getInputProps(path);
        let error: string|undefined = inputProps?.error||undefined;
        try { compile(inputProps?.value||options.value||"")(template); }
        catch (e) { error = (e as {message: string}).message; }
        const exploreButton = <ActionIcon disabled={options.disabled} onClick={()=>{
            setClick(() => (value: string) => form.setFieldValue(path, `${inputProps?.value||""}{{${value}}}`) );
            open();
        }} variant="subtle" ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }} /></ActionIcon>;
        const rightSection =
        <Button.Group style={{marginRight:options.buttons?(error?55:30):error?25:0}} >
            {error&&<Tooltip withArrow label={error} w={220} multiline position="top-end" color="red" ><IconAlertCircle stroke={1.5} color="red" /></Tooltip>}
            {options.buttons}
            <Tooltip label="Template Explorer" >{exploreButton}</Tooltip>
        </Button.Group>;
        return { rightSection, ...inputProps, error: !!error };
    }, [ template ]);

    const addHelper = (k: string, e: string) => ()=> click(e? e.split(" > ")[0].replace(/[{}]/g, ''): k);
    const explorer = (
    <Drawer position="right" size="lg" opened={opened} onClose={close} overlayProps={{ opacity: 0.2}} title={<Group><Text>Template Explorer</Text></Group>} >
        <TextInput
        pb="xs" leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        placeholder="Search" onChange={event=>setFilter(event.target.value)} value={filter}
        rightSection={ (filter) ? ( <CloseButton size="sm" onClick={() => setFilter("")} aria-label="Clear value" /> ) : undefined }
        />
        {filter?
        <Flex style={{justifyContent: 'center'}} gap="sm" justify="flex-start" align="center" direction="row" wrap="wrap" >
        {filteredTags.map(item => (
            <Button onClick={()=>click(item)} variant="default" radius="xl" size="compact-xs" key={item}>{item}</Button>
        ))}
        </Flex> : <>
        {contextualised.map(c=>
        <Section key={c.name} label={c.name} Icon={c.Icon} color={c.color?theme.colors[c.color][6]:undefined} Ricon={IconPlug} onClick={()=>setFilter(`${c.name}.`)}/>
        )}
        {files.length>0&&<Section label="Files" Icon={IconFiles} onClick={()=>setFilter(`$file.`)} Ricon={IconSearch} />}
        {(inline&&inline.length>0)&&<Section open={viewInline} label="Inline" Icon={IconRun} onClick={toggleInline} />}
        <Collapse mt="xs" in={viewInline}>
            <Flex style={{justifyContent: 'center'}} gap="sm" justify="flex-start" align="center" direction="row" wrap="wrap" >
            {(inline||[]).map(item => (
                <Button onClick={()=>click(item)} variant="default" radius="xl" size="compact-xs" key={item}>{item}</Button>
            ))}
            </Flex>
        </Collapse>
        <Section open={viewPaths} label="Paths" Icon={IconFolderCode} onClick={togglePaths} />
        <Collapse mt="xs" in={viewPaths}>
            {paths.map(helper=>
            <UnstyledButton onClick={addHelper(helper.key, helper.example)} mb="xs" key={helper.key} className={classes.connector} p="xs" pt={0} pb={4} >
                <Title size="h6" >{helper.key}</Title>
                {helper.description&&<Text size="xs" c="dimmed" >{helper.description}</Text>}
                {helper.example&&<Code>{helper.example}</Code>}
            </UnstyledButton>)}
        </Collapse>
        <Section open={viewHelpers} label="Helpers" Icon={IconBraces} onClick={toggleHelpers} />
        <Collapse mt="xs" in={viewHelpers}>
            {genericHelpers.map(helper=>
            <UnstyledButton onClick={addHelper(helper.key, helper.example)} mb="xs" key={helper.key} className={classes.connector} p="xs" pt={0} pb={4} >
                <Title size="h6" >{helper.key}</Title>
                {helper.description&&<Text size="xs" c="dimmed" >{helper.description}</Text>}
                {helper.example&&<Code>{helper.example}</Code>}
            </UnstyledButton>)}
        </Collapse>
        </>}
    </Drawer>
    );
    return { explorer, templateProps }
}
