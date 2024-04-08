import { ActionIcon, Button, Drawer, Group, Loader, Tooltip, Text, TextInput } from "@mantine/core";
import { IconAlertCircle, IconCode, IconSearch } from "@tabler/icons-react";
import { compile } from "../modules/handlebars";
import { useCallback, useContext, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import useAPI from "./useAPI2";
import SchemaContext from "../providers/SchemaContext2";

interface getInputProps {
  error?: string;
  value?: string;
}

export default function useTemplater() {
    const { name } = useContext(SchemaContext);
    const [opened, { open, close }] = useDisclosure(false);
    const [ filter, setFilter ] = useState<string>('');
    const template = {};

    const { loading } = useAPI({
        url: `/schema/${name}/storage`,
        default: [],
        fetch: true
    });

    const templateProps = useCallback((getInputProps?: getInputProps) => {
        let error: string|undefined = getInputProps?.error||undefined;
        try {
            compile(getInputProps?.value||"")(template);
        } catch (e) {
            error = (e as {message: string}).message;
        }
        const exploreButton = <ActionIcon onClick={open} variant="subtle" ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }} /></ActionIcon>;

        const rightSection = ( !error ? exploreButton :
        <Button.Group style={{marginRight:30}} >
            <Tooltip withArrow label={error} w={220} multiline position="top-end" color="red" ><IconAlertCircle stroke={1.5} color="red" /></Tooltip>
            {exploreButton}
        </Button.Group>);

        return { rightSection, ...getInputProps, error: !!error };
    }, [  ]);

    const explorer =
    <Drawer position="right" size="sm" opened={opened} onClose={close} overlayProps={{ opacity: 0.2}}
    title={<Group><Text>Template Explorer</Text>{loading&&<Loader size="xs" />}</Group>} >
        <TextInput
        pb="xs" leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        placeholder="Search" onChange={event=>setFilter(event.target.value)} value={filter}
        />
    </Drawer>


    return { templateProps, explorer };
}
