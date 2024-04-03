import { useForm } from '@mantine/form';
import Container from '../Common/Container';
import Head from '../Common/Head';
import ActionButton from './ActionButton';
import { useContext, useEffect } from 'react';
import SchemaContext2 from '../../providers/SchemaContext2';
import { TextInput, Text, Tabs, JsonInput } from '@mantine/core';
import { IconAlignLeft, IconSettings, IconTag } from '@tabler/icons-react';
import useAPI from '../../hooks/useAPI2';
import { notifications } from '@mantine/notifications';

const validName = /[\W\s]|^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
const validate = {
    name: (value: string) => (!validName.test(value) ? null : 'Invalid schema name')
}

export default function Schema() {
    const { initialValues, name, version, close, mutate } = useContext(SchemaContext2);
    const form = useForm({ initialValues, validate });
    useEffect(()=>{
      form.setInitialValues(initialValues);
      form.setValues(initialValues);
    }, [ initialValues ]);
    const { del, loading: l1 } = useAPI({
        url: `/schema/${name}`,
        then: () => close(),
    });
    const { put: save, loading: l2, error } = useAPI({
        url: `/schema/${name}`,
        data: form.values,
        form,
        check: () => {form.validate(); return !form.isValid();},
        then: () => {
            mutate(form.values);
            notifications.show({ title: "Success",message: 'Changes Saved.', color: 'lime', });
        }
    });
    const loading = l1||l2;
    return (<>

    <Container paper={{p:"xs"}} label={<Head rightSection={<ActionButton saving={loading} save={save} form={form} del={del} />} >Schema</Head>} >
    <Tabs defaultValue="settings">
      <Tabs.List>
        <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>Settings</Tabs.Tab>
        <Tabs.Tab value="json" leftSection={<IconAlignLeft size={16} />}>JSON</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="settings" p="xs" >
        {error&&<Text c="red" inline mt={7}>{error}</Text>}
        <Text size="sm" >Schema Version: <b>{version}</b></Text>
        <TextInput
        label="Schema Name" placeholder="Schema Name"
        leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        withAsterisk {...form.getInputProps('name')}
        />
      </Tabs.Panel>

      <Tabs.Panel pt="xs" value="json"><JsonInput autosize readOnly value={JSON.stringify(form.values, null, 2)} /></Tabs.Panel>
    </Tabs>
    </Container></>
    )
}