import { Box, Drawer, Group, TextInput, UnstyledButton, Text, useMantineTheme, Flex, Button, Divider, Loader, Title, Code } from "@mantine/core";
import { SetStateAction, useContext, useEffect, useState } from "react";
import SchemaContext from "./SchemaContext";
import { IconSearch, IconChevronRight, IconFiles, IconBraces } from "@tabler/icons-react";
import providers from "../modules/connectors";
import classes from './ExplorerComponent.module.css';
import useAPI from "../hooks/useAPI";
import { useDisclosure } from "@mantine/hooks";

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
]


export default function ExplorerComponent({ opened, close, click, filter: allowed, templates }: { opened: boolean, close(): void, click: (d: string) => void, filter?: string[], templates?: string[] }) {
    const theme = useMantineTheme();
    const { _connectors, headers, schema } = useContext(SchemaContext);
    const [exploring, { toggle }] = useDisclosure(false);
    const addHelper = (k: string, e: string) => ()=> click(e? e.split(" > ")[0].replace(/[{}]/g, ''): k);

    const { data, loading } = useAPI({
        url: `/schema/${schema?.name}/storage`,
        default: [],
        fetch: true
    });

    const filteredHeaders = !allowed ? headers : Object.keys(headers)
    .filter(key => allowed.includes(key))
    .reduce((obj: {[k: string]:string[]}, key) => {
      obj[key] = headers[key];
      return obj;
    }, {});

    const combined = {...filteredHeaders, $file: data.map((f: { name: string })=>f.name) }


    const [ filter, setFilter ] = useState<string>('');
    const handleInputChange = (event: { target: { value: SetStateAction<string>; }; }) => setFilter(event.target.value);
    const flatHeaders = flattenObjectToArray(combined);

    const flatHeadersXTemplate = !templates ? flatHeaders : [...flatHeaders, ...templates];

    const headerSearch = flatHeadersXTemplate.filter(item =>
        item.toLowerCase().includes(filter.toLowerCase())
    );

    useEffect(()=>{
        if (allowed && allowed.length === 1) {setFilter(`${allowed[0]}.`)}else{setFilter('')}
    }, [allowed]);

    return (
    <Drawer position="right" size="sm" opened={opened} onClose={close} title={<Group><Text>Template Explorer</Text>{loading&&<Loader size="xs" />}</Group>} overlayProps={{ opacity: 0.2}} >
        <TextInput
        pb="xs" leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        placeholder="Search" onChange={handleInputChange} value={filter}
        />
        { filter==="" ?
        <Box>
            {!exploring&&<Box>
                {Object.keys(filteredHeaders).map((name:string)=> {
                    if (!(name in _connectors)) return <>{name} ERROR</>
                    const { id } = _connectors[name];
                    const provider = providers[id];
                    return(
                    <UnstyledButton key={name} onClick={()=>setFilter(`${name}.`)} className={classes.connector} p="xs" mt="xs" >
                        <Group>
                            <Box style={{ display: 'flex', alignItems: 'center' }} >
                                <provider.icon size={17} color={theme.colors[provider.color][6]} />
                            </Box>
                            <div style={{ flex: 1 }}><Text size="sm">{name}</Text></div>
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
            </Box>}
            <UnstyledButton mb="xs" onClick={toggle} className={classes.connector} p="xs" mt="xs" >
                <Group>
                    <Box style={{ display: 'flex', alignItems: 'center' }} >
                        <IconBraces size={17} color="grey" />
                    </Box>
                    <div style={{ flex: 1 }}><Text size="sm">Helpers</Text></div>
                    <IconChevronRight size={17} stroke={1.5} style={{transform: exploring ? `rotate(${90}deg)` : 'none',}} />
                </Group>
            </UnstyledButton>
            {exploring&&
            <Box>
                {helpers.map(helper=><UnstyledButton onClick={addHelper(helper.key, helper.example)} mb="xs" key={helper.key} className={classes.connector} p="xs" pt={0} pb={4} >
                    <Title size="h5" >{helper.key}</Title>
                    {helper.description&&<Text size="xs" c="dimmed" >{helper.description}</Text>}
                    {helper.example&&<Code>{helper.example}</Code>}
                </UnstyledButton>)}
            </Box>}
        </Box>:
        <Flex style={{justifyContent: 'center'}} gap="sm" justify="flex-start" align="center" direction="row" wrap="wrap" >
        {headerSearch.map(item => (
            <Button onClick={()=>click(item)} variant="default" radius="xl" size="compact-xs" key={item}>{item}</Button>
        ))}
        </Flex>
        }
    </Drawer>
    )
}
