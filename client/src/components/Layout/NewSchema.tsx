import { Alert, Button, FileButton, Group, Modal, TextInput } from '@mantine/core'
import { isNotEmpty, useForm } from '@mantine/form';
import { IconAlertCircle, IconTag } from '@tabler/icons-react';
import useAPI from '../../hooks/useAPI2';
import { useContext, useState } from 'react';
import SchemaContext from '../../providers/SchemaContext2';

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

const validName = /[\W\s]|^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
const validate = {
    name:  (value: string) => (!validName.test(value) ? isNotEmpty('Name can not be empty.')(value) : 'Invalid schema name')
}

export default function NewSchema({ opened, close, refresh }: { opened: boolean, close(): void, refresh(): void }) {
    const { loadSchema } = useContext(SchemaContext);
    const [imported, setImported] = useState<Schema|string|undefined>(undefined);
    const importing = imported && typeof imported !== "string" ? true : false;
    const form = useForm({ initialValues: { name: '' }, validate });
    const { post, loading, error } = useAPI<unknown,Schema>({
        url: "/schema",
        data: form.values as Schema,
        form,
        modify: data => importing ? { ...(imported as Schema), ...(data as Schema)} : data,
        check: () => {form.validate(); return !form.isValid();},
        then: (schema: Schema) => { loadSchema(schema.name); close(); refresh(); },
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
        {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
        <Group justify='space-between' mt="md">
            <FileButton onChange={importSchema}>
                {(props) => <Button variant="default" {...props}>{importing ? (imported as Schema).name : 'Import'}</Button>}
            </FileButton>
            <Button loading={loading} onClick={()=>post()} type="submit">{importing?'Import':'Create'}</Button>
        </Group>
    </Modal>
    )
}
