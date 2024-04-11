import { Box, Breadcrumbs, Anchor, Tabs, Group, Button, JsonInput, useMantineTheme, Text, Alert } from "@mantine/core";
import { IconDeviceFloppy, IconTestPipe, IconPackageExport, IconPackageImport, IconX, IconSettings, IconFilter, IconRun, IconAlignLeft, IconAlertCircle } from "@tabler/icons-react";
import Container from "../../Common/Container";
import Head from "../../Common/Head";
import SplitButton from "../../Common/SplitButton";
import Actions from "./Actions";
import Conditions from "./Conditions";
import Settings from "./Settings";
import { useContext, useMemo, useState } from "react";
import { useForm } from "@mantine/form";
import RunModal from "../Run/Run";
import { useDisclosure } from "@mantine/hooks";
import useImporter from "../../../hooks/useImporter";
import { modals } from "@mantine/modals";
import useAPI from "../../../hooks/useAPI2";
import SchemaContext from "../../../providers/SchemaContext2";

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

const importRule: (file: File) => Promise<Rule> = ( file ) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsText(file,'UTF-8');
  reader.onload = readerEvent => {
    const content = readerEvent.target?.result as string;
    try {
      const rule = JSON.parse(content) as Rule;
      if (!rule.name) return reject("Rule structure malformed.");
      resolve(rule);
    }  catch {
      return reject("Invalid rule.");
    }
  }
});

export default function Editor( { editing, close, creating }: { editing: Rule, close(): void, creating: boolean } ) {
  const { name, mutate } = useContext(SchemaContext);
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>('settings');
  const [ running, setRunning ] = useState<Rule|undefined>(undefined);
  const [showJSON, { open: toggleJSON }] = useDisclosure(false);
  const { Modal, open } = useImporter();

  const form = useForm({ initialValues: editing, validate: {} });
  
  const { post, put, loading, error } = useAPI<Rule[]>({
    url: `/schema/${name}/rule`,
    data: { rule: form.values, name: editing.name },
    form: form,
    then: (rules) => { mutate({ rules }); close(); },
  });

  const conditionsAccess = !form.values.primary||!form.values.primaryKey||!form.values.name;
  const actionsAccess = conditionsAccess||(form.values.conditions||[]).length<=0;

  const taken = (form.values.secondaries||[]).map(s=>s.primary);
  const sources = [form.values.primary, ...taken];

  const upload = async (file: File) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {name, ...rule} = await importRule(file);
    form.setValues({...form.values, ...rule});
  }

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

  const templates: string[] = useMemo(()=>{
    const t: string[] = [];
    const allActions =  [...form.values.before_actions||[], ...form.values.actions||[], ...form.values.after_actions||[]];
    for (const action of allActions){
      switch (action.name) {
        case "Encrypt String":{ t.push(action.target as string); break; }
        case "Comparator":{ t.push(action.target as string); break; }
        case "Template": {
          for (const template of action.templates||[]) {
            if (!template.name || template.name.trim()==="") continue;
            t.push(template.name);
          }
        break; }
        default: break;
      }
    } return t;
  }, [ form.values.before_actions, form.values.actions, form.values.after_actions ]);


  return (
  <Box>
    <Modal onDrop={upload} closeup cleanup />
    <RunModal rule={running} close={()=>setRunning(undefined)} test />
    <Container label={<Head rightSection={<Group justify="space-between" >{error&&<Alert pt={6} pb={6} mt="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
      <SplitButton buttonDisabled={conditionsAccess} loading={loading} variant="light" onClick={()=>creating?post():put()} options={[
        {  onClick:()=>creating?post():put(), label: creating?'Create':'Save', leftSection: <IconDeviceFloppy size={16} color={theme.colors['blue'][5]} />, disabled: conditionsAccess },
        {  onClick:()=>setRunning(form.values), label: 'Test', leftSection: <IconTestPipe size={16} color={theme.colors['grape'][5]} />, disabled: conditionsAccess },
        {  onClick:()=>{toggleJSON(); setActiveTab('export');}, label: 'Export', leftSection: <IconPackageExport size={16} color={theme.colors.green[5]}  />, disabled: !form.values.name },
        {  onClick:()=>open(), label: 'Import', leftSection: <IconPackageImport size={16} color={theme.colors.orange[5]}  /> },
        {  onClick:()=>safeClose(), label: 'Cancel', leftSection: <IconX size={16} color={theme.colors['red'][5]} /> },
      ]} >{creating?'Create':'Save'}</SplitButton></Group>
      
    } ><Breadcrumbs>
      <Anchor onClick={()=>safeClose()} fz={26} fw="bold" >Rules</Anchor>
      <Text fz={26} fw="bold" >Rule{creating?' - New':' - Edit'}</Text>
    </Breadcrumbs></Head>} >
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Tab value="settings" leftSection={<IconSettings size="0.8rem" />} >Settings</Tabs.Tab>
        <Tabs.Tab value="conditions" disabled={conditionsAccess} leftSection={<IconFilter size="0.8rem" />}>Conditions</Tabs.Tab>
        <Tabs.Tab value="actions" disabled={actionsAccess} leftSection={<IconRun size="0.8rem" />}>Actions</Tabs.Tab>
        {showJSON&&<Tabs.Tab value="export" disabled={actionsAccess} leftSection={<IconAlignLeft size="0.8rem" />}>Export</Tabs.Tab>}
      </Tabs.List>

      <Tabs.Panel value="settings" p="xs" >{activeTab==="settings"&&<Settings form={form} allow={sources} taken={taken} templates={templates} />}</Tabs.Panel>
      <Tabs.Panel value="conditions"><Conditions form={form} allow={sources} /></Tabs.Panel>
      <Tabs.Panel value="actions"><Actions form={form} allow={sources} templates={templates} /></Tabs.Panel>
      {showJSON&&<Tabs.Panel value="export" p="xs" >
        <Group justify="right" ><Button variant="light" size="xs" leftSection={<IconDeviceFloppy size={16}/>} onClick={()=>exportJSON(form.values, `${form.values.name}.json`)} >Save</Button></Group>
        <JsonInput mt="xs" variant="filled" autosize minRows={4} readOnly value={JSON.stringify(form.values, null, 2)} />
      </Tabs.Panel>}
    </Tabs>
    </Container>
  </Box>
  )
}
