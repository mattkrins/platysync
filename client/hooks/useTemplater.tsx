import { ActionIcon, Box, Button, Code, Collapse, Drawer, Flex, Group, Loader, Text, TextInput, Title, Tooltip, UnstyledButton } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { Icon, IconAlertCircle, IconBraces, IconChevronRight, IconCode, IconFiles, IconProps, IconSearch } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes, useCallback, useMemo, useState } from "react";
import { compile, helpers } from "../modules/handlebars";
import classes from './useTemplater.module.css';
import { useSelector } from "react-redux";
import { getFiles } from "../providers/schemaSlice";

function Section({ onClick, open, label, color, Icon }: { onClick(): void, open: boolean, label: string, color?: string, Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>; }) {
    return (
    <UnstyledButton onClick={onClick} className={classes.connector} p="xs" mt="xs" >
    <Group>
        <Box style={{ display: 'flex', alignItems: 'center' }} >
            <Icon size={17} color={color||"grey"} />
        </Box>
        <div style={{ flex: 1 }}><Text size="sm">{label}</Text></div>
        <IconChevronRight size={17} stroke={1.5} style={{transform: open ? `rotate(${90}deg)` : 'none',}} />
    </Group>
    </UnstyledButton>
    )
}

export default function useTemplater( { context, templates: base }: { context?: string[], templates?: string[] } = {} ) {
    const [ opened, { open, close } ] = useDisclosure(false);
    const [ viewFiles, { toggle: toggleFiles } ] = useDisclosure(false);
    const [ viewHelpers, { toggle: toggleHelpers } ] = useDisclosure(false);
    const [ filter, setFilter ] = useState<string>('');
    const [ click, setClick ] = useState(() => (d: string) => console.log(d));
    const [ inline, SetInline ] = useState<string[]>([]);
    const files = useSelector(getFiles);

    const template = useMemo(()=>{
        const head: {[k: string]: {[k: string]: string}|string } = { $file: {} };
        for (const {name, key} of files) (head.$file as {[k: string]: string})[(key||name)] = key||name;
        return head;
    }, [ files ]);

    const templateProps = useCallback((form: UseFormReturnType<any>, path: string, inline?: string[], buttons?: JSX.Element) => {
        const inputProps = form.getInputProps(path);
        let error: string|undefined = inputProps?.error||undefined;
        try { compile(inputProps?.value||"")(template); }
        catch (e) { error = (e as {message: string}).message; }
        const exploreButton = <ActionIcon onClick={()=>{
            setClick(() => (value: string) => form.setFieldValue(path, `${inputProps?.value||""}{{${value}}}`) );
            if (inline) SetInline(inline);
            open();
        }} variant="subtle" ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }} /></ActionIcon>;
        const rightSection =
        <Button.Group style={{marginRight:buttons?(error?55:30):error?25:0}} >
            {error&&<Tooltip withArrow label={error} w={220} multiline position="top-end" color="red" ><IconAlertCircle stroke={1.5} color="red" /></Tooltip>}
            {buttons}
            {exploreButton}
        </Button.Group>;
        return { rightSection, ...inputProps, error: !!error };
    }, [ template ]);

    const addHelper = (k: string, e: string) => ()=> click(e? e.split(" > ")[0].replace(/[{}]/g, ''): k);
    const explorer = (
    <Drawer position="right" size="sm" opened={opened} onClose={close} overlayProps={{ opacity: 0.2}}
    title={<Group><Text>Template Explorer</Text></Group>} >
        <TextInput
        pb="xs" leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        placeholder="Header Search" onChange={event=>setFilter(event.target.value)} value={filter}
        />
        {files.length>0&&<Section open={viewFiles} label="Files" Icon={IconFiles} onClick={toggleFiles} />}
        <Collapse in={viewFiles}>
            <Flex mt="xs" style={{justifyContent: 'center'}} gap="sm" justify="flex-start" align="center" direction="row" wrap="wrap" >
            {files.map(({ name, key }) => (
                <Button onClick={()=>click(`$file.${key||name}`)} variant="default" radius="xl" size="compact-xs" key={name}>{name}</Button>
            ))}
            </Flex>
        </Collapse>
        <Section open={viewHelpers} label="Helpers" Icon={IconBraces} onClick={toggleHelpers} />
        <Collapse mt="xs" in={viewHelpers}>
            {helpers.map(helper=>
            <UnstyledButton onClick={addHelper(helper.key, helper.example)} mb="xs" key={helper.key} className={classes.connector} p="xs" pt={0} pb={4} >
                <Title size="h5" >{helper.key}</Title>
                {helper.description&&<Text size="xs" c="dimmed" >{helper.description}</Text>}
                {helper.example&&<Code>{helper.example}</Code>}
            </UnstyledButton>)}
        </Collapse>
    </Drawer>
    );
    return { explorer, templateProps }
}
