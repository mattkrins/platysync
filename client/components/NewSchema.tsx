import { TextInput, Button, Group, Alert } from "@mantine/core";
import { useForm, isNotEmpty } from "@mantine/form";
import { useLocation } from "wouter";
import useAPI from "../hooks/useAPI";
import { onKeyUp } from "../modules/common";
import classes from './NewSchema.module.css';
import { useState } from "react";
import Importer from "./Importer";
import { useDisclosure } from "@mantine/hooks";
import { IconAlertCircle } from "@tabler/icons-react";
import { loadSchemas } from "../providers/appSlice";
import { useDispatch } from "../hooks/redux";

export default function NewSchema( { then, defaultImport }: { then?(name: string): void, defaultImport?: Schema } ) {
    const dispatch = useDispatch();
    const [_, setLocation] = useLocation();
    const [importing, setImporting] = useState<Schema|undefined>(defaultImport);
    const [importOpen, { open: openImporter, close: closeImporter }] = useDisclosure(false);
    const form = useForm({
        initialValues: { name: '' },
        validate: {
            name: isNotEmpty('Schema name can not be empty.'),
        },
    });

    const { post, loading, error } = useAPI<string>( {
        url: "/api/v1/schema", form,
        mutateData: (data: object) => importing ? ({...importing, ...data, importing: true }): data,
        then: (name: string) => { setLocation('/'); dispatch(loadSchemas()); if (then) then(name) },
    } );

    const submit = () => post();

    const onImport = (schema: Schema) => { setImporting(schema); closeImporter(); }

    return (
    <>
        <Importer title="Import Schema" opened={importOpen} close={closeImporter} onImport={onImport} onError={()=>setImporting(undefined)} json accept={['application/json']} />
        <TextInput {...form.getInputProps('name')} onKeyUp={onKeyUp(submit)} label="Schema Name" placeholder="schema" required classNames={{ input: classes.input }} />
        {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
        <Group justify='space-between' mt="md">
            <Button onClick={openImporter} variant="default" >{importing&&importing.name?`Importing ${importing.name}`:'Import'}</Button>
            <Button loading={loading} onClick={submit}>Create</Button>
        </Group>
    </>);
}