import { Box, Center, Loader, MultiSelect, SegmentedControl, Select, TextInput, Text, Button, Group, Alert, useMantineTheme } from "@mantine/core";
import { useContext, useEffect } from "react";
import AppContext from "../../providers/AppContext";
import { useForm } from "@mantine/form";
import useAPI from "../../hooks/useAPI";
import { IconAlertCircle, IconCalendar, IconFileSignal } from "@tabler/icons-react";
import cronstrue from 'cronstrue';

export default function Editor( { editing, adding, close, refresh }: { editing: schedule, close(): void, adding?: boolean, refresh(): void } ) {
  const theme = useMantineTheme();
  const { schemas } = useContext(AppContext);
  const form = useForm<schedule>({ initialValues: editing });

  const { data: rules, setData: setRules, loading, error: e1 } = useAPI<string[]>({
      url: `/schema/${form.values.schema}`,
      default: [],
      check: ()=> !form.values.schema,
      monitor: form.values.schema,
      mutate: (schema: Schema) => (schema.rules||[]).map(r=>r.name),
  });

  const { post, put, loading: sending, error: e2 } = useAPI({
      url: '/schedule',
      data: form.values, 
      form,
      noError: true,
      then: () => { refresh(); close(); }
  });

  const error = e1||e2;

  useEffect(() => {
    if (form.values.schema===editing.schema) return;
    form.setFieldValue('rules', []);
    if (!form.values.schema) setRules([]);
  }, [ form.values.schema ]);
  
  useEffect(() => {
    if (form.values.type===editing.type) return;
    form.setFieldValue('value', '');
  }, [ form.values.type ]);

  const useCron = form.values.type==="cron"||form.values.type==="test";
  const cron = useCron && cronstrue.toString(form.values.value, { throwExceptionOnParseError: false });
  const invalidCron = (cron||"").includes("An error occured when generating the expression description");
  const noValue = form.values.value==='';
  const inValid = !form.values.schema || (useCron ? invalidCron : noValue);

  return (
    <Box>
      <Select
      label="Target Schema" required clearable
      placeholder="Pick schema"
      data={schemas}
      {...form.getInputProps('schema')}
      />
      <MultiSelect mt="xs"
      label="Rules" clearable
      description={<>Specify which rules will be run on the schema. Leave blank to run all.<br/>Disabled rules will not be run.</>}
      placeholder={(form.values.rules||[]).length<=0?"All rules":"Pick rules"}
      disabled={rules.length<=0}
      data={rules} rightSection={loading?<Loader size="xs" />:undefined}
      {...form.getInputProps('rules')}
      />
      <SegmentedControl mt="xs" fullWidth 
      {...form.getInputProps('type')}
      defaultValue="cron"
      data={[
          { label: <Center><IconCalendar size={18} stroke={1.5} color={theme.colors["lime"][6]} /><Text size="xs" ml={5} >Schedule</Text></Center>, value: 'cron' },
          { label: <Center><IconFileSignal size={18} stroke={1.5} color={theme.colors["blue"][6]} /><Text size="xs" ml={5} >Monitor</Text></Center>, value: 'monitor' },
        ]}
      />
      {useCron ?
      <TextInput mt="xs"
      label="CRON Expression"
      placeholder={'0 * * * MON-FRI'} required
      description={noValue?
      <>Enter a <a href="https://croner.56k.guru/usage/pattern/" target="_blank">CRON</a> expression to run the schedule.</>: invalidCron ?
      <>Invalid <a href="https://croner.56k.guru/usage/pattern/" target="_blank">CRON</a> syntax.</> : cron}
      {...form.getInputProps('value')}
      error={noValue?false:(invalidCron && cron)}
      />:
      <TextInput mt="xs"
      label="File Path"
      placeholder="D:/watchme.csv" required
      description="Schedule will run when a change is detected within this file."
      {...form.getInputProps('value')}
      />}
      {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
      <Group justify="right" mt="md"><Button loading={sending} disabled={inValid} onClick={()=>adding?post():put()} variant="light" type="submit" >{adding?'Add':'Save'}</Button></Group>
    </Box>
  )
}
