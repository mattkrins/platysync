import { Alert, Button, FileButton, Group, Modal, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconTag } from '@tabler/icons-react';
import { validWindowsFilename } from "../../modules/common";
import useAPI from '../../hooks/useAPI';
import { useContext, useState } from 'react';
import SchemaContext from '../../providers/SchemaContext';

function parse(file: File): Promise<Schema> {
    return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.readAsText(file,'UTF-8');
        reader.onload = readerEvent => {
          const content = readerEvent.target?.result as string;
          try {
            const schema = JSON.parse(content) as Schema;
            if (!schema.name) return reject("Structure malformed.");
            resolve(schema);
          }  catch { return reject("Invalid."); }
        }
    });
}

export default function NewSchema({ opened, close, refresh }: { opened: boolean, close(): void, refresh(): void }) {
    const { changeSchema } = useContext(SchemaContext);
    const [imported, setImported] = useState<Schema|string|undefined>(undefined);
    const importing = imported && typeof imported !== "string" ? true : false;
    const form = useForm({
        initialValues: { name: '' },
        validate: { name: (value: string) => (validWindowsFilename(value) ? null : 'Invalid schema name'), }
    });
    const { post: create, loading, error } = useAPI({
        url: "/schema",
        data: form.values,
        modify: (options) => {
            if (importing) options.data = { ...(imported as Schema), ...options.data};
            return options;
        },
        before: () => form.validate(),
        check: () => !form.isValid(),
        catch: ({validation}) => form.setErrors(validation),
        then: (schema: Schema) => { changeSchema(schema.name); close(); refresh(); },
    });

    const importSchema = async (file: File | null) => {
        if (!file) return;
        try {
            const schema = await parse(file);
            setImported(schema);
        } catch (e) {
            setImported(e as string);
        }
    }

    return (
    <Modal opened={opened} onClose={close} title="New Schema">
        <TextInput
            label="Schema Name" placeholder="Schema Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            withAsterisk {...form.getInputProps('name')}
        />
        {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} title="Error" color="red">{error}</Alert>}
        <Group justify='space-between' mt="md">
            <FileButton onChange={importSchema}>
                {(props) => <Button variant="default" {...props}>{importing ? (imported as Schema).name : 'Import'}</Button>}
            </FileButton>
            <Button loading={loading} onClick={create} type="submit">{importing?'Import':'Create'}</Button>
        </Group>
    </Modal>
    )
}
