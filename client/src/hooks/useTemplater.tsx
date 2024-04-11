import { ActionIcon, Button, Drawer, Group, Loader, Tooltip, Text, TextInput, useMantineTheme, Box, UnstyledButton, Divider, Code, Title, Flex } from "@mantine/core";
import { IconAlertCircle, IconBraces, IconChevronRight, IconCode, IconFiles, IconSearch, IconTemplate } from "@tabler/icons-react";
import { compile } from "../modules/handlebars";
import { useCallback, useContext, useMemo, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import useAPI from "./useAPI";
import SchemaContext from "../providers/SchemaContext2";
import classes from './useTemplater.module.css';
import providers from "../components/Connectors/providers";
import { UseFormReturnType } from "@mantine/form";

function flattenObjectToArray(obj: {[id: string]: string[]}) {
    const result = [];
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const subArray = obj[key];
            for (const value of subArray) {
                result.push(`${key}.${value}`);
            }
        }
    } return result;
}

const helpers = [
    { key: "$upper", description: "Converts the input to UPPERCASE.", example: "{{$upper 'HELLO world'}} > HELLO WORLD" },
    { key: "$lower", description: "Converts the input to lowercase.", example: "{{$lower 'HELLO world'}} > hello world" },
    { key: "$title", description: "Converts the input to Title Case.", example: "{{$title 'HELLO world'}} > Hello World" },
    { key: "$cap", description: "Capitalizes the first letter of the input.", example: "{{$cap 'hello world'}} > Hello world" },
    { key: "$escape", description: "Escapes special characters in the input string.", example: "{{$escape '& <'}} > &amp; &lt" },
    { key: "$clean", description: "Removes extra whitespace and newlines from the input.", example: "{{$clean 'hello \\n world \\n'}} > hello world" },
    { key: "$find", description: "Searches for the substring. Returns true or false.", example: "{{$find 'haystack' 'needle'}} > false" },
    { key: "$inc", description: "Increments a numeric value by 1.", example: "{{$inc '2'}} > 3" },
    { key: "$rand", description: "Generates a random integer between the specified range.", example: "{{$rand 1 9}} > 5" },
    { key: "$special", description: "Generates a random special character from '!?$%&*)>'.", example: "{{$special}} > %" },
    { key: "$word", description: "Retrieves a random word from the dictionary.", example: "{{$word}} > bread" },
    { key: "$grad", description: "Converts a numeric value to a graduation year.", example: "{{$grad '7'}} > 2029 (if run in 2024)" },
    { key: "$dir", description: "Prints working directory of cdapp.", example: "{{$dir}} > C:\\Users\\user\\AppData\\Roaming\\cdapp" },
];

//NOTE - Component will not Fast Refresh. Unknown why.
export default function useTemplater( { allow, templates: base }: { allow?: string[], templates?: string[] } = {} ) {
    const theme = useMantineTheme();
    const [ opened, { open, close } ] = useDisclosure(false);
    const [ explore1, { toggle } ] = useDisclosure(false);
    const { name, connectors, headers } = useContext(SchemaContext);
    const [ explore2, { toggle: custom } ] = useDisclosure(false);
    const [ filter, setFilter ] = useState<string>('');
    const [ templates, SetTemplates ] = useState<string[]>([]);
    const [ click, setClick ] = useState(() => (d: string) => console.log(d));

    const { data: files, loading } = useAPI<Doc[]>({
        url: `/schema/${name}/storage`,
        default: [],
        fetch: true
    });

    const template = useMemo(()=>{
        const head: {[k: string]: {[k: string]: string}|string } = { $file: {} };
        for (const name of Object.keys(headers)){
            if (!((allow||[]).includes(name))) continue;
            head[name] = head[name]||{};
            for (const key of headers[name]) (head[name] as {[k: string]: string})[key] = key;
        }
        for (const file of files) (head.$file as {[k: string]: string})[file.name] = file.name;
        if (base) for (const t of base) head[t] = t;
        return head;
    }, [ headers, files, base ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templateProps = useCallback((form: UseFormReturnType<any>, path: string, templates?: string[], buttons?: JSX.Element) => {
        const inputProps = form.getInputProps(path);
        let error: string|undefined = inputProps?.error||undefined;
        try { compile(inputProps?.value||"")(template); }
        catch (e) { error = (e as {message: string}).message; }
        const exploreButton = <ActionIcon onClick={()=>{
            setClick(() => (value: string) => form.setFieldValue(path, `${inputProps?.value||""}{{${value}}}`) );
            if (templates) SetTemplates(templates);
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

    const list = useMemo(()=> connectors.
    filter(c=>headers[c.name]).
    filter(c=>providers[c.id]).
    filter(c=>allow?allow.includes(c.name):true).
    map(c=>({header: headers[c.name], provider: providers[c.id], ...c})),
    [ connectors, headers, providers, allow ]);

    const cTemplates = templates.filter(t=>t);
    const tags = useMemo(()=> [...flattenObjectToArray({...headers, $file: files.map((f: { name: string })=>f.name) }), ...cTemplates].filter(t=>t), [ headers, files, templates ]);
    const filteredTags = useMemo(()=> tags.filter(item => item.toLowerCase().includes(filter.toLowerCase()) ), [ tags, filter ]);
    const addHelper = (k: string, e: string) => ()=> click(e? e.split(" > ")[0].replace(/[{}]/g, ''): k);
    const explorer =
    <Drawer position="right" size="sm" opened={opened} onClose={close} overlayProps={{ opacity: 0.2}}
    title={<Group><Text>Template Explorer</Text>{loading&&<Loader size="xs" />}</Group>} >
        <TextInput
        pb="xs" leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        placeholder="Search" onChange={event=>setFilter(event.target.value)} value={filter}
        />
        { filter==="" ?
        <Box>
            {list.map(item=> {
                return(
                <UnstyledButton key={item.name} onClick={()=>setFilter(`${item.name}.`)} className={classes.connector} p="xs" mt="xs" >
                    <Group>
                        <Box style={{ display: 'flex', alignItems: 'center' }} >
                            <item.provider.Icon size={17} color={theme.colors[item.provider.color][6]} />
                        </Box>
                        <div style={{ flex: 1 }}><Text size="sm">{item.name}</Text></div>
                        <IconChevronRight size={17} stroke={1.5} />
                    </Group>
                </UnstyledButton>
            )})}
            <Divider mt="xs" />
            <UnstyledButton onClick={()=>setFilter('$file.')} className={classes.connector} p="xs" mt="xs" >
                <Group>
                    <Box style={{ display: 'flex', alignItems: 'center' }} >
                        <IconFiles size={17} color="grey" />
                    </Box>
                    <div style={{ flex: 1 }}><Text size="sm">Files</Text></div>
                    <IconChevronRight size={17} stroke={1.5} />
                </Group>
            </UnstyledButton>
            {cTemplates.length>0&&<>
            <UnstyledButton onClick={()=>custom()} className={classes.connector} p="xs" mt="xs" >
                <Group>
                    <Box style={{ display: 'flex', alignItems: 'center' }} >
                        <IconTemplate size={17} color="grey" />
                    </Box>
                    <div style={{ flex: 1 }}><Text size="sm">Custom</Text></div>
                    <IconChevronRight size={17} stroke={1.5} style={{transform: explore2 ? `rotate(${90}deg)` : 'none',}} />
                </Group>
            </UnstyledButton> {explore2&&
            <Box m="xs" >
                <Flex style={{justifyContent: 'center'}} gap="sm" justify="flex-start" align="center" direction="row" wrap="wrap" >
                {cTemplates.map(item => (
                    <Button onClick={()=>click(item)} variant="default" radius="xl" size="compact-xs" key={item}>{item}</Button>
                ))}
                </Flex>
            </Box>}
            </>}
            <UnstyledButton mb="xs" onClick={toggle} className={classes.connector} p="xs" mt="xs" >
                <Group>
                    <Box style={{ display: 'flex', alignItems: 'center' }} >
                        <IconBraces size={17} color="grey" />
                    </Box>
                    <div style={{ flex: 1 }}><Text size="sm">Helpers</Text></div>
                    <IconChevronRight size={17} stroke={1.5} style={{transform: explore1 ? `rotate(${90}deg)` : 'none',}} />
                </Group>
            </UnstyledButton>
            {explore1&&
            <Box> {helpers.map(helper=>
                <UnstyledButton onClick={addHelper(helper.key, helper.example)} mb="xs" key={helper.key} className={classes.connector} p="xs" pt={0} pb={4} >
                    <Title size="h5" >{helper.key}</Title>
                    {helper.description&&<Text size="xs" c="dimmed" >{helper.description}</Text>}
                    {helper.example&&<Code>{helper.example}</Code>}
                </UnstyledButton>)}
            </Box>}
        </Box> :
        <Flex style={{justifyContent: 'center'}} gap="sm" justify="flex-start" align="center" direction="row" wrap="wrap" >
        {filteredTags.map(item => (
            <Button onClick={()=>click(item)} variant="default" radius="xl" size="compact-xs" key={item}>{item}</Button>
        ))}
        </Flex>}
    </Drawer>


    return { templateProps, explorer };
}
