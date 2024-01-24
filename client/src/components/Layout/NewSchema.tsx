import { Alert, Button, FileButton, Group, Modal, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconTag } from '@tabler/icons-react';
import { validWindowsFilename } from '../../modules/common';
import useAPI from '../../hooks/useAPI';
import { useContext, useState } from 'react';
import SchemaContext from '../../providers/SchemaContext';

export default function NewSchema({ opened, close, refresh }: { opened: boolean, close(): void, refresh(): void }) {
    const { changeSchema } = useContext(SchemaContext);
    const [file, setFile] = useState<File | null>(null);
    const form = useForm({
        initialValues: { name: '' },
        validate: { name: (value: string) => (validWindowsFilename(value) ? null : 'Invalid schema name'), }
    });
    const { post: create, loading: l1, error: e1 } = useAPI({
        url: "/schema",
        data: form.values,
        before: () => form.validate(),
        check: () => !form.isValid(),
        catch: ({validation}) => form.setErrors(validation),
        then: (schema: Schema) => { changeSchema(schema.name); close(); refresh(); },
    });
    const { post, loading: l2, error: e2 } = useAPI({
        url: "/schema/import",
        data: form.values,
        before: () => form.validate(),
        check: () => !form.isValid(),
        catch: ({validation}) => form.setErrors(validation),
        then: (schema: Schema) => { changeSchema(schema.name); close(); refresh(); },
    });

    const upload = () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', form.values.name);
        post({data: formData});
    }

    const loading = l1||l2;
    const error = e1||e2;

    return (
    <Modal opened={opened} onClose={close} title="New Schema">
        <TextInput
            label="Schema Name" placeholder="Schema Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            withAsterisk {...form.getInputProps('name')}
        />
        {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} title="Error" color="red">{error}</Alert>}
        <Group justify='space-between' mt="md">
            <FileButton onChange={setFile}>
                {(props) => <Button variant="default" {...props}>{file?.name||'Import'}</Button>}
            </FileButton>
            <Button loading={loading} onClick={file?upload:create} type="submit">{file?'Import':'Create'}</Button>
        </Group>
    </Modal>
    )
}
