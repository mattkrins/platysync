import { useForm } from '@mantine/form';
import Container from '../Common/Container';
import Head from '../Common/Head';
import ActionButton from './ActionButton';
import { useContext } from 'react';
import SchemaContext from '../../providers/SchemaContext';
import { TextInput, Text, Tabs, JsonInput } from '@mantine/core';
import { IconAlignLeft, IconSettings, IconTag } from '@tabler/icons-react';
import useAPI from '../../hooks/useAPI';
import { notifications } from '@mantine/notifications';

const validName = /[\W\s]|^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
const validate = {
    name: (value: string) => (!validName.test(value) ? null : 'Invalid schema name')
}

export default function Schema() {
    const { schema, mutate, changeSchema } = useContext(SchemaContext);
    const form = useForm({ initialValues: schema, validate });
    const { del, loading: l1 } = useAPI({
        url: `/schema/${schema?.name}`,
        then: () => changeSchema(undefined),
    });
    const { put: save, loading: l2, error } = useAPI({
        url: `/schema/${schema?.name}`,
        data: form.values,
        before: () => form.validate(),
        check: () => !form.isValid(),
        catch: ({validation}) => form.setErrors(validation),
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
        <Text size="sm" >Schema Version: <b>{schema?.version}</b></Text>
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