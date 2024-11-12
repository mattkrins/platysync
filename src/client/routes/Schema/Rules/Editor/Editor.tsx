import { Anchor, Container, Group, Tabs, ThemeIcon, Title, Tooltip, Text, Badge, useMantineTheme } from "@mantine/core";
import { IconAlertCircle, IconFilter, IconInfoCircle, IconPackageExport, IconPackageImport, IconRun, IconSettings, IconTable, IconTestPipe, IconX } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import Wrapper from "../../../../components/Wrapper";
import { isNotEmpty, useForm, UseFormReturnType } from "@mantine/form";
import { useConnectors, useDispatch, useSelector } from "../../../../hooks/redux";
import { getRules, loadRules } from "../../../../providers/schemaSlice";
import { modals } from "@mantine/modals";
import { useLocation } from "wouter";
import useAPI from "../../../../hooks/useAPI";
import SplitButton from "../../../../components/SplitButton";
import Run from "../../../../components/Run/Run";
import General from "./General";
import Importer from "../../../../components/Importer";
import { useDisclosure } from "@mantine/hooks";
import Exporter from "../../../../components/Exporter";
import Columns from "./Columns";
import Conditions from "../../../../components/Conditions";
import useRule from "../../../../hooks/useRule";
import Actions from "./Actions";

export interface editorTab {
  form: UseFormReturnType<Rule>;
  setTab(tab: string): void;
  iterative?: boolean;
}

const blankRule: Rule = {
  name: "", enabled: false, log: false,
  sources: [], conditions: [], initActions: [], iterativeActions: [], finalActions: [], columns: [],
  primaryOverrides: {}
};

function ActionButton( { loading, save, test, cancel, clickExport, openImporter }: { loading?: boolean, save(): void, test(): void, cancel(): void, clickExport(): void, openImporter(): void } ) {
  const theme = useMantineTheme();
  return (
    <SplitButton loading={loading} onClick={save} options={[
      {  onClick:()=>test(), label: 'Test', leftSection: <IconTestPipe size={16} color={theme.colors.grape[5]}  /> },
      {  onClick:()=>clickExport(), label: 'Export', leftSection: <IconPackageExport size={16} color={theme.colors.green[5]}  /> },
      {  onClick:()=>openImporter(), label: 'Import', leftSection: <IconPackageImport size={16} color={theme.colors.orange[5]}  /> },
      {  onClick:()=>cancel(), label: 'Cancel', leftSection: <IconX size={16} color={theme.colors.red[5]}  /> },
      ]} >Save</SplitButton>
  )
}

function ConditionsTab({ form, setTab }: editorTab) {
  const { proConnectors, sources } = useRule(form.values);
  const ldap = useMemo(()=> {
    return proConnectors.filter(c=>c.id==="ldap").map(c=>c.name)
    .filter(c=>sources.includes(c)).length > 0;
  },[ sources, proConnectors ]);
  return <Conditions form={form} rule={form.values} ldap={ldap} />
}

export default function Editor({ params }: { params: Record<string, string> }) {
  const [importOpen, { open: openImporter, close: closeImporter }] = useDisclosure(false);
  const [location, setLocation] = useLocation();
  const dispatch = useDispatch();
  const rules = useSelector(getRules);
  const editing = !!params.rule;
  const [tab, setTab] = useState<string | null>('general');
  const [testing, setTest] = useState<Rule | undefined>(undefined);
  const [exporting, setExporting] = useState<Rule|undefined>(undefined);
  const rule = editing ? (rules.find(r=>r.name===params.rule)) : blankRule;
  const form = useForm<Rule>({ validate: {
    name: isNotEmpty('Name must not be empty.'),
  }, initialValues: structuredClone(rule) });
  const dirty = form.isTouched();

  const cancel = () => {  setLocation(editing ? `${location}/../../../rules` : `${location}/../../rules`); };
  const safeCancel = () => dirty ? modals.openConfirmModal({
      title: 'Attention: Unsaved Changes Detected', centered: true,
      labels: { confirm: 'Close', cancel: "Cancel" }, confirmProps: { color: 'red' },
      children: (
      <Text size="sm">
          It appears that you have made changes to this rule.<br/>
          Closing without saving will result in the loss of these changes.<br/>
          Would you like to close without saving?
      </Text> ),
      onConfirm: () => cancel(),
  }) : cancel();

  const { post, put, error, loading } = useAPI({
    url: `/rule${editing?`/${rule?.name}`:''}`, form, schema: true,
    then: () => { dispatch(loadRules()); cancel();  }
  });
  const clickExport = () => setExporting(form.values);
  const onImport = ({name, ...rule}: Rule) => { form.setValues(rule); closeImporter(); };
  if (editing && !rule) return <Title c="red" >ERROR! You should go <Anchor onClick={()=>cancel()} >Back</Anchor></Title>
  return (
    <Container size="lg">
        <Importer title="Import Schema" opened={importOpen} close={closeImporter} onImport={onImport} json accept={['application/json']} />
        <Exporter title="Export Rule" filename={exporting?`${exporting.name||"rule"}.json`:''} data={exporting?JSON.stringify(exporting, null, 2):''} json close={()=>setExporting(undefined)} />
        {testing&&<Run rule={testing} close={()=>setTest(undefined)} test />}
        <Group justify="space-between">
            <Title mb="xs" ><Title mb="xs" onClick={safeCancel} component={Anchor} >Rules</Title> / Rule - {editing?'Edit':'New'}</Title>
            {dirty&&<Badge size="xs" leftSection={<IconInfoCircle size={14} />} color="orange">Unsaved changes</Badge>}
            <Group>
            {error&&<Tooltip color="red" position="bottom-end" label={error} multiline >
                <ThemeIcon color="red" radius="xl"><IconAlertCircle/></ThemeIcon>
            </Tooltip>}
            <ActionButton loading={loading} save={()=>editing?put():post()} test={()=>setTest(form.values)} cancel={safeCancel} clickExport={clickExport} openImporter={openImporter} />
            </Group>
        </Group>
        <Wrapper>
            <Tabs value={tab} onChange={setTab}>
                <Tabs.List>
                    <Tabs.Tab value="general" leftSection={<IconSettings size="1rem" />} >General</Tabs.Tab>
                    <Tabs.Tab value="conditions" disabled={!form.values.primary} leftSection={<IconFilter size="1rem" />}>Conditions</Tabs.Tab>
                    <Tabs.Tab value="actions" leftSection={<IconRun size="1rem" />}>Actions</Tabs.Tab>
                    <Tabs.Tab value="columns" disabled={!form.values.primary} leftSection={<IconTable size="1rem" />}>Columns</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="general" pt="xs" >{tab==="general"&&<General form={form} setTab={setTab} />}</Tabs.Panel>
                <Tabs.Panel value="conditions" pt="xs" >{tab==="conditions"&&<ConditionsTab form={form} setTab={setTab} />}</Tabs.Panel>
                <Tabs.Panel value="actions" pt="xs" >{tab==="actions"&&<Actions form={form} setTab={setTab} />}</Tabs.Panel>
                <Tabs.Panel value="columns" pt="xs" >{tab==="columns"&&<Columns form={form} setTab={setTab} />}</Tabs.Panel>
            </Tabs>
        </Wrapper> 
    </Container>
  )
}
