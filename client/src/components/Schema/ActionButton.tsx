import { Text, useMantineTheme } from '@mantine/core';
import { IconTrash, IconPackageExport, IconPackageImport } from '@tabler/icons-react';
import useAPI from '../../hooks/useAPI';
import { modals } from '@mantine/modals';
import { useContext } from 'react';
import SchemaContext from '../../providers/SchemaContext';
import useModal from '../../hooks/useModal';
import ImportModal from './ImportModal';
import SplitButton from '../Common/SplitButton';

export default function ActionButton({ save, saving }: { save(): void, saving: boolean }) {
    const theme = useMantineTheme();
    const { schema, changeSchema } = useContext(SchemaContext);
    const { Modal, opened: importerOpen, open: openImporter, close: closeImporter } = useModal("Import Schema");
    const { del, loading: deleting } = useAPI({
        url: `/schema/${schema?.name}`,
        then: () => changeSchema(undefined),
    });
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
    const auth: {session: string} = JSON.parse(JSON.parse(localStorage.getItem("auth")||"") || {});
    const url = new URL(window.location.href);
    return (<>
        {importerOpen&&<Modal><ImportModal close={closeImporter} /></Modal>}
        <SplitButton loading={saving||deleting} variant="light" onClick={save} options={[
        {  component: "a", href: `http://${url.hostname}:2327/api/v1/schema/${schema?.name}/export/${auth.session}`,
        label: 'Export', leftSection: <IconPackageExport size={16} color={theme.colors.green[5]}  /> },
        {  onClick:()=>openImporter(), label: 'Import', leftSection: <IconPackageImport size={16} color={theme.colors.orange[5]}  /> },
        {  onClick:()=>openDeleteModal(), label: 'Delete', leftSection: <IconTrash size={16} color={theme.colors.red[5]}  /> },
        ]} >Save</SplitButton>
    </>);
}