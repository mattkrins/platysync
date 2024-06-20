import { Container, Group, Title, Paper, TextInput, Text, useMantineTheme, Alert } from "@mantine/core";
import { IconAlertCircle, IconCheck, IconPackageExport, IconPackageImport, IconTag, IconTrash } from "@tabler/icons-react";
import classes from '../../App.module.css';
import useAPI from "../../hooks/useAPI";
import { isNotEmpty, useForm } from "@mantine/form";
import { useState } from "react";
import Importer from "../../components/Importer";
import { useDisclosure } from "@mantine/hooks";
import SplitButton from "../../components/SplitButton";
import Exporter from "../../components/Exporter";
import { useAppDispatch, useAppSelector } from "../../providers/hooks";

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
  const dispatch = useAppDispatch();
  const [importing, setImporting] = useState<Schema|undefined>(undefined);
  const [exporting, setExporting] = useState<Schema|undefined>(undefined);
  const [importOpen, { open: openImporter, close: closeImporter }] = useDisclosure(false);
  const { prev, ...initialValues  } = useAppSelector(state => state.schema);
  const form = useForm<Schema>({ initialValues, validate: {
    name: isNotEmpty('Schema name can not be empty.'),
  }, });
  const { data: success, put: save, loading: saving, error } = useAPI<Schema>({
    url: `/api/v1/schema/${initialValues.name}`, form,
    then: (e: Schema) => {
      form.setValues(e);
      form.setInitialValues(e); 
      //dispatch(loadSchema(e.name));
    },
  });
  const onImport = (schema: Schema) => { setImporting(schema); closeImporter(); };
  const clickExport = () => setExporting(initialValues);
  const clickDel = () => setExporting(initialValues);
  return (
  <Container>
    <Importer title="Import Schema" opened={importOpen} close={closeImporter} onImport={onImport} onError={()=>setImporting(undefined)} json accept={['application/json']} />
    <Exporter title="Export Schema" filename={exporting?`${exporting.name}.json`:''} data={exporting?JSON.stringify(exporting, null, 2):''} json close={()=>setExporting(undefined)} />
    <Group justify="space-between">
      <Title mb="xs" >Schema Settings</Title>
      <ActionButton save={save} saving={saving} open={openImporter} clickExport={clickExport} clickDel={clickDel} />
    </Group>
    <Paper p="lg" className={classes.box} withBorder pos="relative">
      {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Settings saved successfully.</Alert>}
      {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
      <Text size="sm" >Schema Version: <b>{initialValues.version}</b></Text>
      <TextInput
        label="Schema Name" placeholder="Schema Name"
        leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        withAsterisk {...form.getInputProps('name')}
      />
    </Paper>
  </Container>
  )
}
