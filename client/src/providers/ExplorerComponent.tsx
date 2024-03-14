import { Box, Drawer, Group, TextInput, UnstyledButton, Text, useMantineTheme, Flex, Button } from "@mantine/core";
import { SetStateAction, useContext, useEffect, useState } from "react";
import SchemaContext from "./SchemaContext";
import { IconSearch, IconChevronRight } from "@tabler/icons-react";
import providers from "../modules/connectors";
import classes from './ExplorerComponent.module.css';

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

export default function ExplorerComponent({ opened, close, click, filter: allowed, templates }: { opened: boolean, close(): void, click: (d: string) => void, filter?: string[], templates?: string[] }) {
    const theme = useMantineTheme();
    const { _connectors, headers } = useContext(SchemaContext);

    const filteredHeaders = !allowed ? headers : Object.keys(headers)
    .filter(key => allowed.includes(key))
    .reduce((obj: {[k: string]:string[]}, key) => {
      obj[key] = headers[key];
      return obj;
    }, {});

    const [ filter, setFilter ] = useState<string>('');
    const handleInputChange = (event: { target: { value: SetStateAction<string>; }; }) => setFilter(event.target.value);
    const flatHeaders = flattenObjectToArray(filteredHeaders);

    const flatHeadersXTemplate = !templates ? flatHeaders : [...flatHeaders, ...templates];

    const headerSearch = flatHeadersXTemplate.filter(item =>
        item.toLowerCase().includes(filter.toLowerCase())
    );

    useEffect(()=>{
        if (allowed && allowed.length === 1) {setFilter(`${allowed[0]}.`)}else{setFilter('')}
    }, [allowed])

    return (
    <Drawer position="right" size="xs" opened={opened} onClose={close} title="Template Explorer" overlayProps={{ opacity: 0.2}} >
        <TextInput
        pb="xs" leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        placeholder="Search" onChange={handleInputChange} value={filter}
        />
        { filter==="" ?
            Object.keys(filteredHeaders).map((name:string)=> {
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
            )}) :
            <Flex style={{justifyContent: 'center'}} gap="sm" justify="flex-start" align="center" direction="row" wrap="wrap" >
            {headerSearch.map(item => (
                <Button onClick={()=>click(item)} variant="default" radius="xl" size="compact-xs" key={item}>{item}</Button>
            ))}
            </Flex>
        }
    </Drawer>
    )
}
