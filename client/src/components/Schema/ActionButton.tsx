import { Text, useMantineTheme } from '@mantine/core';
import { IconTrash, IconPackageExport, IconPackageImport } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { useContext } from 'react';
import SchemaContext from '../../providers/SchemaContext2';
import SplitButton from '../Common/SplitButton';
import useImporter from '../../hooks/useImporter';
import { UseFormReturnType } from '@mantine/form';

function exportJSON(obj: object, filename: string) {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const importSchema: (file: File) => Promise<Schema> = ( file ) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file,'UTF-8');
    reader.onload = readerEvent => {
      const content = readerEvent.target?.result as string;
      try {
        const rule = JSON.parse(content) as Schema;
        if (!rule.name) return reject("Rule structure malformed.");
        resolve(rule);
      }  catch {
        return reject("Invalid rule.");
      }
    }
});

interface Props {
    save(): void;
    saving: boolean;
    form: UseFormReturnType<Schema, (values: Schema) => Schema>;
    del: () => void;
}
export default function ActionButton({ save, saving, form, del }: Props) {
    const theme = useMantineTheme();
    const { name, initialValues } = useContext(SchemaContext);
    const { Modal, open } = useImporter();
    const openDeleteModal = () =>
    modals.openConfirmModal({
        title: 'Delete Schema',
        centered: true,
        children: (
        <Text size="sm">
            Are you sure you want to delete this schema? This action is destructive and cannot be reversed.
        </Text>
        ),
        labels: { confirm: 'Delete schema', cancel: "No don't delete it" },
        confirmProps: { color: 'red' },
        onConfirm: () => del(),
    });
    const upload = async (file: File) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {name, ...schema} = await importSchema(file) ;
        form.setValues({...form.values, ...schema})
    }

    return (<>
        <Modal onDrop={upload} closeup cleanup />
        <SplitButton loading={saving} variant="light" onClick={save} options={[
        {  onClick:()=>exportJSON(initialValues, `${name}.json`), label: 'Export', leftSection: <IconPackageExport size={16} color={theme.colors.green[5]}  /> },
        {  onClick:()=>open(), label: 'Import', leftSection: <IconPackageImport size={16} color={theme.colors.orange[5]}  /> },
        {  onClick:()=>openDeleteModal(), label: 'Delete', leftSection: <IconTrash size={16} color={theme.colors.red[5]}  /> },
        ]} >Save</SplitButton>
    </>);
}