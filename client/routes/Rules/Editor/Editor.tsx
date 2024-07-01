import { Container, Group, Title, Anchor, useMantineTheme, Tabs, Text } from "@mantine/core";
import { IconFilter, IconPackageExport, IconPackageImport, IconRun, IconSettings, IconTestPipe, IconX } from "@tabler/icons-react";
import Wrapper from "../../../components/Wrapper";
import { useLocation } from "wouter";
import SplitButton from "../../../components/SplitButton";
import { isNotEmpty, useForm } from "@mantine/form";
import useAPI from "../../../hooks/useAPI";
import { useState } from "react";
import Settings from "./Settings";
import { modals } from "@mantine/modals";

const validate = {
    name: isNotEmpty('Name must not be empty.'),
}

function ActionButton( { loading, save, test, cancel }: { loading?: boolean, save(): void, test(): void, cancel(): void } ) {
  const theme = useMantineTheme();
  return (
    <SplitButton loading={loading} onClick={save} options={[
      {  onClick:()=>test(), label: 'Test', leftSection: <IconTestPipe size={16} color={theme.colors.grape[5]}  /> },
      {  onClick:()=>save(), label: 'Export', leftSection: <IconPackageExport size={16} color={theme.colors.green[5]}  /> },
      {  onClick:()=>save(), label: 'Import', leftSection: <IconPackageImport size={16} color={theme.colors.orange[5]}  /> },
      {  onClick:()=>cancel(), label: 'Cancel', leftSection: <IconX size={16} color={theme.colors.red[5]}  /> },
      ]} >Save</SplitButton>
  )
}

export default function Editor({ editing, close }: { editing: [Rule,boolean], close(): void }) {
    const [_, setLocation] = useLocation();
    const [activeTab, setActiveTab] = useState<string | null>('settings');
    const form = useForm<Rule>({ validate, initialValues: structuredClone(editing[0]) });
    const adding = (editing && editing[0] && !editing[1]) || false ;
    const { post: test } = useAPI<boolean>({
        url: `/rule/test`, form, schema: true,
    });

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

    const used = (form.values.sources||[]).map(s=>s.foreignName);
    const sources = form.values.primary ? [form.values.primary, ...used] : [];

    return (
    <Container>
        <Group justify="space-between">
            <Title mb="xs" ><Title mb="xs" onClick={safeCancel} component={Anchor} >Rules</Title> / Rule - {adding?'New':'Edit'}</Title>
            <ActionButton save={()=>{}} test={()=>test()} cancel={safeCancel} />
        </Group>
        <Wrapper>
            <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
                <Tabs.Tab value="settings" leftSection={<IconSettings size="1rem" />} >Settings</Tabs.Tab>
                <Tabs.Tab value="conditions" disabled={!form.values.primary} leftSection={<IconFilter size="1rem" />}>Conditions</Tabs.Tab>
                <Tabs.Tab value="actions" leftSection={<IconRun size="1rem" />}>Actions</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="settings" p="xs" >{activeTab==="settings"&&<Settings form={form} used={used} sources={sources} />}</Tabs.Panel>
            </Tabs>
        </Wrapper>
    </Container>
    )
}