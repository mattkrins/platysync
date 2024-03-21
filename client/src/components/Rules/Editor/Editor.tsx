import { Box, Tabs } from "@mantine/core";
import { IconSettings, IconFilter, IconRun, IconX } from "@tabler/icons-react";
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

export default function Editor({ editing, close }: { editing: Rule|undefined, close(): void }) {
  const { schema, mutate } = useContext(SchemaContext);
  const [activeTab, setActiveTab] = useState<string | null>('settings');
 
  const initialValues = {
    secondaries: [],
    conditions: [],
    actions: [],
    before_actions: [],
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

  const loading = l1||l2;

  const conditionsAccess = !form.values.primary||!form.values.primaryKey;
  const actionsAccess = conditionsAccess||(form.values.conditions||[]).length<=0;

  const taken = (form.values.secondaries||[]).map(s=>s.primary);
  const sources = [form.values.primary, ...taken];

  return (
  <Box>
    <Container label={<Head rightSection={
      <SplitButton loading={loading} variant="light" onClick={editing?save:add} options={[
        {  onClick:()=>close(), label: 'Cancel', leftSection: <IconX size={16}  /> }
      ]} >{editing?'Save':'Create'}</SplitButton>
      
    } >Rule{editing?' - Edit':' - New'}</Head>} >
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Tab value="settings" leftSection={<IconSettings size="0.8rem" />} >Settings</Tabs.Tab>
        <Tabs.Tab value="conditions" disabled={conditionsAccess} leftSection={<IconFilter size="0.8rem" />}>Conditions</Tabs.Tab>
        <Tabs.Tab value="actions" disabled={actionsAccess} leftSection={<IconRun size="0.8rem" />}>Actions</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="settings" p="xs" >{activeTab==="settings"&&<Settings form={form} sources={sources} taken={taken} />}</Tabs.Panel>
      <Tabs.Panel value="conditions"><Conditions form={form} sources={sources} /></Tabs.Panel>
      <Tabs.Panel value="actions"><Actions form={form} /></Tabs.Panel>
    </Tabs>
    </Container>
  </Box>
  )
}
