import { Anchor, Box, Breadcrumbs, Button, Group, JsonInput, Tabs, Text, useMantineTheme } from "@mantine/core";
import { IconSettings, IconFilter, IconRun, IconX, IconTestPipe, IconDeviceFloppy, IconAlignLeft, IconPackageExport, IconPackageImport } from "@tabler/icons-react";
import { useContext, useEffect, useState } from "react";
import Settings from "./Settings";
import { useForm } from "@mantine/form";
import Conditions from "./Conditions";
import Head from "../../Common/Head";
import Container from '../../Common/Container';
import SplitButton from "../../Common/SplitButton";
import Actions from "./Actions";
import useAPI from "../../../hooks/useAPI";
import { notifications } from "@mantine/notifications";
import SchemaContext from "../../../providers/SchemaContext";
import { modals } from '@mantine/modals';
import RunModal from "../Run/Run";
import { useDisclosure } from "@mantine/hooks";

function exportRule(obj: Rule, filename: string) {
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
const parseRule: () => Promise<Rule> = () => new Promise((resolve, reject) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.click();
  input.onchange = (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsText(file,'UTF-8');
    reader.onload = readerEvent => {
      const content = readerEvent.target?.result as string;
      try {
        const rule = JSON.parse(content) as Rule;
        if (!rule.name||!rule.primary||!rule.conditions||!rule.actions) return reject("Rule structure malformed.");
        notifications.show({ title: "Success",message: 'Rule Imported.', color: 'lime', });
        resolve(rule);
      }  catch {
        return reject("Invalid rule.");
      }
    }
  }
  
});

export default function Editor({ editing, close }: { editing: Rule|undefined, close(): void }) {
  const { schema, mutate } = useContext(SchemaContext);
  const [activeTab, setActiveTab] = useState<string | null>('settings');
  const [ running, setRunning ] = useState<Rule|undefined>(undefined);
  const [jsonTab, { open: toggleJSON }] = useDisclosure(false);
  const theme = useMantineTheme();
 
  const initialValues = {
    name: '',
    primary: undefined,
    secondaries: [],
    conditions: [],
    before_actions: [],
    actions: [],
    after_actions: [],
    config: {},
  } as unknown as Rule;
  const form = useForm({ initialValues, validate: {} });
  useEffect(()=>{
    form.reset();
    if (editing) {form.setValues(editing as never)} else {form.setValues(initialValues); }
    form.setInitialValues(initialValues);
  }, [ editing ]);

  const { post: add, loading: l1 } = useAPI({
      url: `/schema/${schema?.name}/rule`,
      data: {...form.values },
      catch: ({validation}) => form.setErrors(validation),
      then: ({rules, _rules}) => {
        mutate({rules, _rules});
        close();
        notifications.show({ title: "Success",message: 'Rule Added.', color: 'lime', });
      }
  });

  const { put: save, loading: l2 } = useAPI({
      url: `/schema/${schema?.name}/rule/${editing?.name}`,
      data: {...form.values },
      catch: ({validation}) => form.setErrors(validation),
      then: ({rules, _rules}) => {
        mutate({rules, _rules});
        close();
        notifications.show({ title: "Success",message: 'Rule Saved.', color: 'lime', });
      }
  });

  const importRule = async () => {
    try {
      const rule = await parseRule();
      form.setValues(rule);
    } catch (e) {
      notifications.show({ title: "Failed to import",message: e as string, color: 'red', });
    }
  }

  const loading = l1||l2;

  const conditionsAccess = !form.values.primary||!form.values.primaryKey;
  const actionsAccess = conditionsAccess||(form.values.conditions||[]).length<=0;

  const taken = (form.values.secondaries||[]).map(s=>s.primary);
  const sources = [form.values.primary, ...taken];

  const safeClose = () => form.isTouched() ? modals.openConfirmModal({
        title: 'Attention: Unsaved Changes Detected',
        centered: true,
        children: (
        <Text size="sm">
            It appears that you have made changes to the rule.<br/>
            Closing without saving will result in the loss of your modifications.<br/>
            Would you like to close without saving?
        </Text>
        ),
        labels: { confirm: 'Close', cancel: "Cancel" },
        confirmProps: { color: 'red' },
        onConfirm: () => close(),
    }) : close();

  return (
  <Box>
    <RunModal rule={running} close={()=>setRunning(undefined)} test />
    <Container label={<Head rightSection={
      <SplitButton buttonDisabled={conditionsAccess} loading={loading} variant="light" onClick={editing?save:add} options={[
        {  onClick:()=>editing?save():add(), label: editing?'Save':'Create', leftSection: <IconDeviceFloppy size={16} color={theme.colors['blue'][5]} />, disabled: conditionsAccess },
        {  onClick:()=>setRunning(form.values), label: 'Test', leftSection: <IconTestPipe size={16} color={theme.colors['grape'][5]} />, disabled: conditionsAccess },
        {  onClick:()=>{toggleJSON(); setActiveTab('export');}, label: 'Export', leftSection: <IconPackageExport size={16} color={theme.colors.green[5]}  />, disabled: !form.values.name },
        {  onClick:()=>importRule(), label: 'Import', leftSection: <IconPackageImport size={16} color={theme.colors.orange[5]}  /> },
        {  onClick:()=>safeClose(), label: 'Cancel', leftSection: <IconX size={16} color={theme.colors['red'][5]} /> },
      ]} >{editing?'Save':'Create'}</SplitButton>
      
    } ><Breadcrumbs>
      <Anchor onClick={()=>safeClose()} fz={26} fw="bold" >Rules</Anchor>
      <Text fz={26} fw="bold" >Rule{editing?' - Edit':' - New'}</Text>
    </Breadcrumbs></Head>} >
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Tab value="settings" leftSection={<IconSettings size="0.8rem" />} >Settings</Tabs.Tab>
        <Tabs.Tab value="conditions" disabled={conditionsAccess} leftSection={<IconFilter size="0.8rem" />}>Conditions</Tabs.Tab>
        <Tabs.Tab value="actions" disabled={actionsAccess} leftSection={<IconRun size="0.8rem" />}>Actions</Tabs.Tab>
        {jsonTab&&<Tabs.Tab value="export" disabled={actionsAccess} leftSection={<IconAlignLeft size="0.8rem" />}>Export</Tabs.Tab>}
      </Tabs.List>

      <Tabs.Panel value="settings" p="xs" >{activeTab==="settings"&&<Settings form={form} sources={sources} taken={taken} />}</Tabs.Panel>
      <Tabs.Panel value="conditions"><Conditions form={form} sources={sources} /></Tabs.Panel>
      <Tabs.Panel value="actions"><Actions form={form} /></Tabs.Panel>
      {jsonTab&&<Tabs.Panel value="export" p="xs" >
        <Group justify="right" ><Button variant="light" size="xs" leftSection={<IconDeviceFloppy size={16}/>} onClick={()=>exportRule(form.values, `${form.values.name}.json`)} >Save</Button></Group>
        <JsonInput mt="xs" variant="filled" autosize minRows={4} readOnly value={JSON.stringify(form.values, null, 2)} />
      </Tabs.Panel>}
    </Tabs>
    </Container>
  </Box>
  )
}
