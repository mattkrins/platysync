import { Container, Group, Title, Anchor, useMantineTheme, Tabs, Text } from "@mantine/core";
import { IconFilter, IconLayoutNavbarCollapse, IconPackageExport, IconPackageImport, IconRun, IconSettings, IconTable, IconTestPipe, IconX } from "@tabler/icons-react";
import Wrapper from "../../../components/Wrapper";
import { useLocation } from "wouter";
import SplitButton from "../../../components/SplitButton";
import { UseFormReturnType, isNotEmpty, useForm } from "@mantine/form";
import { useMemo, useState } from "react";
import Settings from "./Settings";
import { modals } from "@mantine/modals";
import Conditions from "./Conditions";
import Headers from "./Columns";
import { useConnectors } from "../../../hooks/redux";
import Actions from "./Actions";
import Run from "../../../components/Run/Run";
import Exporter from "../../../components/Exporter";
import Importer from "../../../components/Importer";
import { useDisclosure } from "@mantine/hooks";

const validate = {
    name: isNotEmpty('Name must not be empty.'),
}

function ActionButton( { loading, save, test, cancel, clickExport, openImporter, canTest }: { loading?: boolean, save(): void, test(): void, cancel(): void, clickExport(): void, openImporter(): void, canTest: boolean } ) {
  const theme = useMantineTheme();
  return (
    <SplitButton loading={loading} onClick={save} options={[
      {  onClick:()=>test(), label: 'Test', leftSection: <IconTestPipe size={16} color={theme.colors.grape[5]}  />, disabled: !canTest },
      {  onClick:()=>clickExport(), label: 'Export', leftSection: <IconPackageExport size={16} color={theme.colors.green[5]}  /> },
      {  onClick:()=>openImporter(), label: 'Import', leftSection: <IconPackageImport size={16} color={theme.colors.orange[5]}  /> },
      {  onClick:()=>cancel(), label: 'Cancel', leftSection: <IconX size={16} color={theme.colors.red[5]}  /> },
      ]} >Save</SplitButton>
  )
}

export function useRule( form: UseFormReturnType<Rule> ) {
    const usedSources = (form.values.sources||[]).map(s=>s.foreignName);
    const usedContexts = (form.values.contexts||[]).map(s=>s.name); 
    const sources = form.values.primary ? [form.values.primary, ...usedSources, ...usedContexts] : [];
    const { proConnectors } = useConnectors();
    const contextSources = useMemo(()=>{
        const contextCapable = proConnectors.filter(c=>c.Context).map(c=>c.name);
        return contextCapable.filter(c=>!sources.includes(c));
    }, [ proConnectors, sources ]);
    const ruleProConnectors = useMemo(()=>proConnectors.filter(c=>sources.includes(c.name)), [ proConnectors, sources ]);
    const primary = useMemo(()=>proConnectors.find((item) => item.name === form.values.primary), [ form.values.primary ]);
    const primaryHeaders = primary ? primary.headers : [];
    const displayExample = `{{${form.values.primary?`${form.values.primary}.`:''}${form.values.primaryKey ? form.values.primaryKey :  (primaryHeaders[0] ? primaryHeaders[0] : 'id')}}}`;
    const inline = useMemo(()=>{
        let map: {[k: string]: string[]} = {};
        for (const type of ['initActions', 'iterativeActions', 'finalActions']){
            let array: string[] = [];
            for (const action of (form.values[type as 'initActions']||[])){
                switch (action.name) {
                    case "Encrypt String":{ if (action.key) array.push(action.key as string); break; }
                    case "Comparator":{ if (action.key) array.push(action.key as string); break; }
                    case "Template":{
                        array = [...array, ...((action.templates||[]) as SysTemplate[]).filter(s=>s.key).map(s=>s.key) ]; break;
                    }
                    default: break;
                }
            } map[type] = array;
        } return map;
    }, [ form.values.initActions, form.values.iterativeActions, form.values.finalActions ])
    return { used: usedSources, sources, usedContexts, contextSources, ruleProConnectors, primary, primaryHeaders, displayExample, inline };
}

export default function Editor({ editing, close }: { editing: [Rule,boolean], close(): void }) {
    const [_, setLocation] = useLocation();
    const [importOpen, { open: openImporter, close: closeImporter }] = useDisclosure(false);
    const [exporting, setExporting] = useState<Rule|undefined>(undefined);
    const [activeTab, setActiveTab] = useState<string | null>('settings');
    const [rule, setRule] = useState<Rule | undefined>(undefined);
    const form = useForm<Rule>({ validate, initialValues: structuredClone(editing[0]) });
    const adding = (editing && editing[0] && !editing[1]) || false ;
    const cancel = () => { close(); setLocation("/"); };
    const safeCancel = () => form.isTouched() ? modals.openConfirmModal({
        title: 'Attention: Unsaved Changes Detected', centered: true,
        labels: { confirm: 'Close', cancel: "Cancel" }, confirmProps: { color: 'red' },
        children: (
        <Text size="sm">
            It appears that you have made changes to this rule.<br/>
            Closing without saving will result in the loss of your modifications.<br/>
            Would you like to close without saving?
        </Text> ),
        onConfirm: () => cancel(),
    }) : cancel();
    const onImport = ({name, ...rule}: Rule) => { form.setValues(rule); closeImporter(); };

    const clickExport = () => setExporting(form.values);

    const canTest = (form.values.initActions.length + form.values.iterativeActions.length + form.values.finalActions.length) > 0;

    return (
    <Container size="lg">
        <Importer title="Import Schema" opened={importOpen} close={closeImporter} onImport={onImport} json accept={['application/json']} />
        <Exporter title="Export Rule" filename={exporting?`${exporting.name||"rule"}.json`:''} data={exporting?JSON.stringify(exporting, null, 2):''} json close={()=>setExporting(undefined)} />
        <Run rule={rule} close={()=>setRule(undefined)} />
        <Group justify="space-between">
            <Title mb="xs" ><Title mb="xs" onClick={safeCancel} component={Anchor} >Rules</Title> / Rule - {adding?'New':'Edit'}</Title>
            <ActionButton save={()=>{}} test={()=>setRule(form.values)} cancel={safeCancel} clickExport={clickExport} openImporter={openImporter} canTest={canTest} />
        </Group>
        <Wrapper>
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="settings" leftSection={<IconSettings size="1rem" />} >Settings</Tabs.Tab>
                    <Tabs.Tab value="conditions" disabled={!form.values.primary} leftSection={<IconFilter size="1rem" />}>Conditions</Tabs.Tab>
                    <Tabs.Tab value="actions" leftSection={<IconRun size="1rem" />}>Actions</Tabs.Tab>
                    <Tabs.Tab value="columns" disabled={!form.values.primary} leftSection={<IconTable size="1rem" />}>Columns</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="settings" pt="xs" >{activeTab==="settings"&&<Settings form={form} setActiveTab={setActiveTab} />}</Tabs.Panel>
                <Tabs.Panel value="conditions" pt="xs" >{activeTab==="conditions"&&<Conditions form={form} />}</Tabs.Panel>
                <Tabs.Panel value="actions" pt="xs" >{activeTab==="actions"&&<Actions form={form} setActiveTab={setActiveTab} />}</Tabs.Panel>
                <Tabs.Panel value="columns" pt="xs" >{activeTab==="columns"&&<Headers form={form} />}</Tabs.Panel>
            </Tabs>
        </Wrapper>
    </Container>
    )
}