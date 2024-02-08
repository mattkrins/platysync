import { useForm } from '@mantine/form';
import { validWindowsFilename } from '../../modules/common';
import Container from '../Common/Container';
import Head from '../Common/Head';
import ActionButton from './ActionButton';
import { useContext } from 'react';
import SchemaContext from '../../providers/SchemaContext';
import { TextInput, Text } from '@mantine/core';
import { IconTag } from '@tabler/icons-react';
import useAPI from '../../hooks/useAPI';
import { notifications } from '@mantine/notifications';

export default function Schema() {
    const { schema, mutate } = useContext(SchemaContext);
    const form = useForm({
        initialValues: schema,
        validate: { name: (value: string) => (validWindowsFilename(value) ? null : 'Invalid schema name'), }
    });
    const { put: save, loading: saving } = useAPI({
        url: `/schema/${schema?.name}`,
        data: form.values,
        before: () => form.validate(),
        check: () => !form.isValid(),
        catch: ({validation}) => form.setErrors(validation),
        then: () => {
            mutate(form.values);
            notifications.show({ title: "Success",message: 'Settings Saved.', color: 'lime', });
        }
    });
    return (
    <Container label={<Head rightSection={<ActionButton saving={saving} save={save} />} >Schema Settings</Head>} >
        <Text size="sm" >Schema Version: <b>{schema?.version}</b></Text>
        <TextInput
        label="Schema Name" placeholder="Schema Name"
        leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        withAsterisk {...form.getInputProps('name')}
        />
    </Container>
    )
}