import { Button, Center, Group, Modal, NumberInput, Switch, Tabs, Textarea, TextInput } from "@mantine/core";
import { isNotEmpty, useForm, UseFormReturnType } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconTag } from "@tabler/icons-react";
import { useState } from "react";

const validate = {
  name: isNotEmpty('Name can not be empty.'),
}

function Triggers({ form }: { form: UseFormReturnType<Schedule> } ) {
  const triggers = form.getInputProps("triggers").value as [];
  return <>Triggers</>
}

function Tasks({ form }: { form: UseFormReturnType<Schedule> } ) {
  const [opened, { toggle, open, close }] = useDisclosure(false);
  const [ editing, setEditing ] = useState<{}>()

  const actions = form.getInputProps("tasks").value as [];
  const add = () => form.insertListItem("tasks", { key: undefined, value: undefined, });
  return (
  <>
    <Modal opened={opened} onClose={close} size="xl" title="test">
    </Modal>
    <Group justify="end" mt="xs" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Task</Button></Group>
    {actions.length===0&&<Center c="dimmed" fz="xs" >No tasks configured.</Center>}
  </>)
}

function General({ form }: { form: UseFormReturnType<Schedule> } ) {
  return (<>
    <TextInput
      label="Name" mt="xs"
      placeholder="Schedule Name" required
      {...form.getInputProps('name')}
      leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
    />
    <Switch label="Enabled" mt="xs" {...form.getInputProps('enabled', { type: 'checkbox' })} />
    <Textarea
        label="Description" mt="xs"
        placeholder="Describe what this schedule does."
        {...form.getInputProps('description')}
    />
    <NumberInput
        label="Fail After" mt="xs"
        description="Fails if schedule does not complete within specified milliseconds."
        placeholder="x milliseconds"
        min={100}
        {...form.getInputProps('failAfter')}
    />
    <NumberInput
        label="Retry Count" mt="xs"
        description="Disable the schedule if it fails x times consecutively."
        placeholder="x times"
        min={1} max={10}
        {...form.getInputProps('disableAfter')}
    />
    </>)
}

function Content({ schedule, refresh, adding, close }: { schedule: Schedule, refresh(): void, adding: boolean, close(): void }) {
  const form = useForm<Schedule>({ validate, initialValues: structuredClone(schedule) });
  return (
    <Tabs defaultValue="general">
      <Tabs.List grow>
        <Tabs.Tab value="general">General</Tabs.Tab>
        <Tabs.Tab value="tasks">Tasks</Tabs.Tab>
        <Tabs.Tab value="triggers">Triggers</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="general"><General form={form} /></Tabs.Panel>
      <Tabs.Panel value="tasks"><Tasks form={form} /></Tabs.Panel>
      <Tabs.Panel value="triggers"><Triggers form={form} /></Tabs.Panel>
    </Tabs>
  )
}

export default function Editor({ editing, close, refresh }: { editing?: [Schedule,boolean], close(): void, refresh(): void }) {
  const adding = (editing && editing[0] && !editing[1]) || false ;
  return (
    <Modal opened={!!editing} onClose={close} size="xl" title={adding ? "New Schedule" : "Edit Schedule"}>
      {editing&&<Content schedule={editing[0]} refresh={refresh} adding={adding} close={close} />}
    </Modal>
  );
}