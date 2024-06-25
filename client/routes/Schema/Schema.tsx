import { Container, Group, Title, TextInput, Text, useMantineTheme, Alert } from "@mantine/core";
import { IconAlertCircle, IconCheck, IconPackageExport, IconPackageImport, IconTag, IconTrash } from "@tabler/icons-react";
import useAPI from "../../hooks/useAPI";
import { hasLength, isNotEmpty, useForm } from "@mantine/form";
import { useState } from "react";
import Importer from "../../components/Importer";
import { useDisclosure } from "@mantine/hooks";
import SplitButton from "../../components/SplitButton";
import Exporter from "../../components/Exporter";
import { useDispatch, useSelector } from "../../hooks/redux";
import { onKeyUp } from "../../modules/common";
import schemaSlice, { init, mutate } from "../../providers/schemaSlice";
import { loadSchemas } from "../../providers/appSlice";
import Wrapper from "../../components/Wrapper";
import { useLocation } from "wouter";
import { modals } from "@mantine/modals";

function ActionButton( { save, saving, open, clickExport, clickDel }: { save(): void, saving: boolean, open(): void, clickExport(): void, clickDel(): void, } ) {
  const theme = useMantineTheme();
  return (
    <SplitButton loading={saving} onClick={save} options={[
      {  onClick:()=>clickExport(), label: 'Export', leftSection: <IconPackageExport size={16} color={theme.colors.green[5]}  /> },
      {  onClick:()=>open(), label: 'Import', leftSection: <IconPackageImport size={16} color={theme.colors.orange[5]}  /> },
      {  onClick:()=>clickDel(), label: 'Delete', leftSection: <IconTrash size={16} color={theme.colors.red[5]}  /> },
      ]} >Save</SplitButton>
  )
}

export default function Schema() {
  const [_, setLocation] = useLocation();
  const dispatch = useDispatch();
  const [exporting, setExporting] = useState<Schema|undefined>(undefined);
  const [importOpen, { open: openImporter, close: closeImporter }] = useDisclosure(false);
  const { prev, ...initialValues  } = useSelector(state => state.schema);
  const form = useForm<Schema>({ initialValues, validate: {
    name: hasLength({ min: 3 }, 'Name must be greater than 2 characters.'),
  }, });
  const { data: success, put: save, del, loading: saving, error } = useAPI({
    url: `/schema`, form,
    data: { editing: initialValues.name },
    then: () => {
      if (initialValues.name === form.values.name) return;
      dispatch(loadSchemas());
      dispatch(mutate(form.values));
    },
  });
  const onImport = ({name, ...schema}: Schema) => { form.setValues(schema); closeImporter(); };
  const clickExport = () => setExporting(initialValues);

  const clickDel = () =>
    modals.openConfirmModal({
      title: 'Delete Schema',
      children: <Text size="sm">Are you sure you want to delete <b>{initialValues.name}</b>?<br/>This action is destructive and cannot be reversed.</Text>,
      labels: { confirm: 'Delete schema', cancel: "Cancel" },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await del();
        dispatch(init());
        setLocation("/schemas");
      },
  });

  return (
  <Container>
    <Importer title="Import Schema" opened={importOpen} close={closeImporter} onImport={onImport} json accept={['application/json']} />
    <Exporter title="Export Schema" filename={exporting?`${exporting.name}.json`:''} data={exporting?JSON.stringify(exporting, null, 2):''} json close={()=>setExporting(undefined)} />
    <Group justify="space-between">
      <Title mb="xs" >Schema Settings</Title>
      <ActionButton save={save} saving={saving} open={openImporter} clickExport={clickExport} clickDel={clickDel} />
    </Group>
    <Wrapper>
      {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Settings saved successfully.</Alert>}
      {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
      <Text size="sm" >Schema Version: <b>{initialValues.version}</b></Text>
      <TextInput
        label="Schema Name" placeholder="Schema Name"
        leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        withAsterisk {...form.getInputProps('name')} onKeyUp={onKeyUp(save)}
      />
    </Wrapper>
  </Container>
  )
}
