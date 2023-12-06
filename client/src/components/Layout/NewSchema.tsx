import { Alert, Button, Group, Modal, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconTag } from '@tabler/icons-react';
import { validWindowsFilename } from '../../modules/common';
import useAPI from '../../hooks/useAPI';
import { useContext } from 'react';
import SchemaContext from '../../providers/SchemaContext';

export default function NewSchema({ opened, close, refresh }: { opened: boolean, close(): void, refresh(): void }) {
    const { changeSchema } = useContext(SchemaContext);
    const form = useForm({
        initialValues: { name: '' },
        validate: { name: (value: string) => (validWindowsFilename(value) ? null : 'Invalid schema name'), }
    });
    const { post: create, loading, error } = useAPI({
        url: "/schema",
        data: form.values,
        before: () => form.validate(),
        check: () => !form.isValid(),
        catch: ({validation}) => form.setErrors(validation),
        then: (schema: Schema) => { changeSchema(schema.name); close(); refresh(); },
    });
    return (
    <Modal opened={opened} onClose={close} title="New Schema">
        <TextInput
            label="Schema Name" placeholder="Schema Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            withAsterisk {...form.getInputProps('name')}
        />
        {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} title="Error" color="red">{error}</Alert>}
        <Group justify="right" mt="md">
            <Button loading={loading} onClick={create} type="submit">Create Schema</Button>
        </Group>
    </Modal>
    )
}
