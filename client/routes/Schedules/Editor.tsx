import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Button, Center, Grid, Group, Modal, MultiSelect, NumberInput, Paper, Select, Switch, Tabs, Textarea, TextInput, Text, Anchor, Alert, Tooltip } from "@mantine/core";
import { isNotEmpty, useForm, UseFormReturnType } from "@mantine/form";
import { IconAlertCircle, IconCheck, IconCheckbox, IconClock, IconCopy, IconEdit, IconFileSearch, IconGripVertical, IconPlus, IconRun, IconTag, IconTrash } from "@tabler/icons-react";
import MenuTip from "../../components/MenuTip";
import { useSelector } from "../../hooks/redux";
import { getRules } from "../../providers/schemaSlice";
import useEditor from "../../hooks/useEditor";
import cronstrue from 'cronstrue';
import useAPI from "../../hooks/useAPI";

function TriggerEditor({ open, adding, close, task_form, index }: { open: Trigger, adding?: boolean, close(): void, task_form: UseFormReturnType<Schedule>, index?: number } ) {
  const form = useForm<Trigger>({ validate: {
    name: isNotEmpty('Trigger type can not be empty.'),
  }, initialValues: structuredClone(open) });
  const name: string = form.getInputProps("name").value;
  const invalid = () => { form.validate(); return !form.isValid(); }
  const add = () => { if (invalid()) return; task_form.insertListItem("triggers", form.getValues() ); close(); }
  const edit = () => { if (invalid()) return; task_form.setFieldValue(`triggers.${index}`, form.getValues()); close(); }
  const useCron = form.values.name==="cron";
  const cron = useCron && cronstrue.toString(form.values.cron, { throwExceptionOnParseError: false });
  const invalidCron = (cron||"").includes("An error occured when generating the expression description");
  const noValue = form.values.cron==='';
  const inValid = (useCron ? invalidCron : noValue);
  return (
  <>
    <Select
      label="Trigger Type" withAsterisk
      placeholder="Select a trigger to execute this schedule"
      data={[{ value: 'watch', label: 'Watch File' },{ value: 'cron', label: 'Cron Schedule' }]}
      {...form.getInputProps("name")}
    />
    {{cron:<>
      <TextInput mt="xs"
        label="CRON Expression"
        placeholder={'0 * * * MON-FRI'} required
        description={<>Enter a <Anchor size="xs" href="https://croner.56k.guru/usage/pattern/" target="_blank" >CRON</Anchor> expression to run the schedule.</>}
        {...form.getInputProps('cron')}
        error={noValue?false:(invalidCron && cron)}
      /><Text truncate="end" size="xs" c="blue" mt={2} >{!inValid&&`Runs ${cron}`}</Text>
      </>,
      watch:<>
      <TextInput mt="xs"
      label="File Path"
      placeholder="D:/watchme.csv" required
      description="Schedule will run when a change is detected within this file."
      {...form.getInputProps('watch')}
      /><Text truncate="end" size="xs" c="blue">{cron}</Text>
      </>,
    }[name]}

    <Switch
    label="Trigger Enabled" mt="xs"
    {...form.getInputProps("enabled", { type: 'checkbox' })}
    />
    <Group justify={"flex-end"} mt="md">
          <Button disabled={form.values.name==="cron"?inValid:!form.values.watch} onClick={()=>adding?add():edit()}>{adding ? "Add" : "Save"}</Button>
    </Group>
  </>)
}

export function triggerDetails(entry: Trigger) {
  switch (entry.name) {
    case "cron":{
      const cron = cronstrue.toString(entry.cron||"", { throwExceptionOnParseError: false });
      const invalidCron = (cron||"").includes("An error occured when generating the expression description");
      return invalidCron ? cron : `Runs ${cron}`;
    }
    case "watch": return `Watching for changes to '${entry.watch}'`;
    default: return "Error";
  }
}

function Trigger({ form, index, entry, path, edit }: { form: UseFormReturnType<Schedule>, index: number, entry: Trigger, path: string, edit(task: Trigger, i: number): void } ) {
  const copy = () => form.insertListItem(path, structuredClone(entry));
  const remove = () => form.removeListItem(path, index);
  const toggle = () => form.setFieldValue(`${path}.${index}.enabled`, !entry.enabled);
  const Icon = () => {
    switch (entry.name) {
      case "cron": return <IconClock size={18} />
      case "watch": return <IconFileSearch size={18} />
      default: return "";
    }
  }
  return (
  <Draggable index={index} draggableId={String(index)}>
      {provided => (
        <Paper withBorder mb="xs" {...provided.draggableProps} style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }} ref={provided.innerRef}>
          <Grid align="center" gutter="xs" p="xs" >
              <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                  <Group><IconGripVertical size="1.2rem" /></Group>
              </Grid.Col>
              <Grid.Col span={2} ><Group gap="xs" ><Icon/>{entry.name}</Group></Grid.Col>
              <Grid.Col span={6} ><Text truncate="end">{triggerDetails(entry)}</Text></Grid.Col>
              <Grid.Col span={3}>
                  <Group justify="right" gap="xs">
                    <Switch onChange={()=>toggle()} checked={entry.enabled} />
                    <MenuTip label="Copy" Icon={IconEdit} onClick={()=>edit(entry, index)} variant="default" />
                    <MenuTip label="Copy" Icon={IconCopy} onClick={copy} variant="default" />
                    <MenuTip label="Delete" Icon={IconTrash} onClick={remove} variant="default" />
                  </Group>
              </Grid.Col>
          </Grid>
        </Paper>
      )}
  </Draggable>)
}

function TriggerTab({ form }: { form: UseFormReturnType<Schedule> } ) {
  const entries = form.getInputProps("triggers").value as Trigger[];
  const [ entry, isEditing, { editing, add, close, edit } ] =  useEditor<Trigger, number>({ name: "", enabled: true, cron: "", watch: "" });
  return (
  <>
    <Modal opened={!!entry} onClose={close} size="md" title={isEditing ? "Edit Trigger" : "New Trigger"}>
      {entry&&<TriggerEditor open={entry} close={close} task_form={form} adding={!isEditing} index={editing} />}
    </Modal>
    <Paper mb="xs" p="xs" mt="xs" withBorder >
        <Grid justify="space-between" align="center">
            <Grid.Col span={1}/>
            <Grid.Col span={2}>Type</Grid.Col>
            <Grid.Col span={6}>Details</Grid.Col>
            <Grid.Col span={3}><Group justify="right" gap="xs">
              <Button onClick={()=>add()} size="xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Trigger</Button></Group>
            </Grid.Col>
        </Grid>
    </Paper>
    {entries.length===0&&<Paper mb="xs" p="xs" mt="xs" withBorder ><Center c="dimmed" >No triggers configured.</Center></Paper>}
    <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem("triggers", { from: source.index, to: destination? destination.index : 0 }) } >
        <Droppable droppableId="dnd-list" direction="vertical">
        {(provided) => (
        <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
            {entries.map((entry, index) => <Trigger key={index} index={index} entry={entry} form={form} path={"triggers"} edit={edit} />)}
            {provided.placeholder}
        </div>
        )}
    </Droppable>
    </DragDropContext>
  </>)
}

function TaskEditor({ open, adding, close, task_form, index }: { open: Task, adding?: boolean, close(): void, task_form: UseFormReturnType<Schedule>, index?: number } ) {
  const form = useForm<Task>({ validate: {
    name: isNotEmpty('Task type can not be empty.'),
  }, initialValues: structuredClone(open) });
  const rules = useSelector(getRules);
  const ruleData = rules.filter(r=>r.enabled).map(r=>r.name);
  const name = form.getInputProps("name").value;
  const selected_rules = form.getInputProps("rules").value as string[];
  const invalid = () => { form.validate(); return !form.isValid(); }
  const add = () => { if (invalid()) return; task_form.insertListItem("tasks", form.getValues() ); close(); }
  const edit = () => { if (invalid()) return; task_form.setFieldValue(`tasks.${index}`, form.getValues()); close(); }
  return (
  <>
    <Select
      label="Task Type" withAsterisk
      placeholder="Select a task to run"
      data={[{ value: 'run', label: 'Run Rules' }]}
      {...form.getInputProps("name")}
    />
    {name==="run"&&<>
    <MultiSelect
      label="Rules" leftSection={<IconCheckbox size={16} />}
      placeholder={ (Array.isArray(selected_rules) && selected_rules.length > 0) ? "Pick rules":"All rules"}
      data={ruleData}
      {...form.getInputProps("rules")}
    />
    {ruleData.length<=0&&<Text size="xs" mt={2} c="red">No enabled rules.</Text>}
    </>
    }
    <Switch
    label="Task Enabled" mt="xs"
    {...form.getInputProps("enabled", { type: 'checkbox' })}
    />
    <Group justify={"flex-end"} mt="md">
          <Button onClick={()=>adding?add():edit()}>{adding ? "Add" : "Save"}</Button>
    </Group>
  </>)
}

function Task({ form, index, entry, path, edit }: { form: UseFormReturnType<Schedule>, index: number, entry: Task, path: string, edit(task: Task, i: number): void } ) {
  const copy = () => form.insertListItem(path, structuredClone(entry));
  const remove = () => form.removeListItem(path, index);
  const details = (entry.rules||[]).length > 0 ? `${(entry.rules||[]).join(', ')}` : `[ All Rules ]`;
  const toggle = () => form.setFieldValue(`${path}.${index}.enabled`, !entry.enabled)
  return (
  <Draggable index={index} draggableId={String(index)}>
      {provided => (
        <Paper withBorder mb="xs" {...provided.draggableProps} style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }} ref={provided.innerRef}>
          <Grid align="center" gutter="xs" p="xs" >
              <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                  <Group><IconGripVertical size="1.2rem" /></Group>
              </Grid.Col>
              <Grid.Col span={2} ><Group gap="xs" ><IconRun size={18} />{entry.name}</Group></Grid.Col>
              <Grid.Col span={6} ><Text truncate="end">{details}</Text></Grid.Col>
              <Grid.Col span={3}>
                  <Group justify="right" gap="xs">
                    <Switch onChange={()=>toggle()} checked={entry.enabled} />
                    <MenuTip label="Copy" Icon={IconEdit} onClick={()=>edit(entry, index)} variant="default" />
                    <MenuTip label="Copy" Icon={IconCopy} onClick={copy} variant="default" />
                    <MenuTip label="Delete" Icon={IconTrash} onClick={remove} variant="default" />
                  </Group>
              </Grid.Col>
          </Grid>
        </Paper>
      )}
  </Draggable>)
}

function TaskTab({ form }: { form: UseFormReturnType<Schedule> } ) {
  const entries = form.getInputProps("tasks").value as Task[];
  const [ entry, isEditing, { editing, add, close, edit } ] =  useEditor<Task, number>({ name: "", enabled: true, rules: [] });
  return (
  <>
    <Modal opened={!!entry} onClose={close} size="md" title={isEditing ? "Edit Task" : "New Task"}>
      {entry&&<TaskEditor open={entry} close={close} task_form={form} adding={!isEditing} index={editing} />}
    </Modal>
    <Paper mb="xs" p="xs" mt="xs" withBorder >
        <Grid justify="space-between" align="center">
            <Grid.Col span={1}/>
            <Grid.Col span={2}>Type</Grid.Col>
            <Grid.Col span={6}>Details</Grid.Col>
            <Grid.Col span={3}><Group justify="right" gap="xs">
              <Button onClick={()=>add()} size="xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Task</Button></Group>
            </Grid.Col>
        </Grid>
    </Paper>
    {entries.length===0&&<Paper mb="xs" p="xs" mt="xs" withBorder ><Center c="dimmed" >No tasks configured.</Center></Paper>}
    <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem("tasks", { from: source.index, to: destination? destination.index : 0 }) } >
        <Droppable droppableId="dnd-list" direction="vertical">
        {(provided) => (
        <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
            {entries.map((entry, index) => <Task key={index} index={index} entry={entry} form={form} path={"tasks"} edit={edit} />)}
            {provided.placeholder}
        </div>
        )}
    </Droppable>
    </DragDropContext>
  </>)
}

function General({ form }: { form: UseFormReturnType<Schedule> } ) {
  return (
  <Paper withBorder p="xs" mt="xs" >
    <TextInput
      label="Name"
      placeholder="Schedule Name" required
      {...form.getInputProps('name')}
      leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
    />
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
        label="Disable After" mt="xs"
        description="Disable the schedule if it fails x times consecutively."
        placeholder="x times"
        min={1} max={10}
        {...form.getInputProps('disableAfter')}
    />
    <Switch label="Enabled" mt="xs" {...form.getInputProps('enabled', { type: 'checkbox' })} />
    </Paper>)
}

function Content({ open: schedule, refresh, adding, close }: { open: Schedule, refresh(): void, adding?: boolean, close(): void }) {
  const form = useForm<Schedule>({ validate: {
    name: isNotEmpty('Name can not be empty.'),
    tasks: v => v.length > 0 ? false : "No tasks configured.",
    triggers: v => v.length > 0 ? false : "No triggers configured.",
  }, initialValues: structuredClone(schedule) });
  const { data: success, put, post, loading, error } = useAPI<unknown, ActionConfig>({
      url: `/schedule${adding?'':`/${schedule.name}`}`, schema: true, form: form,
      then: () => { refresh(); close(); },
  });
  return (
  <>
    <Tabs defaultValue="general">
      <Tabs.List grow>
        <Tabs.Tab value="general">General</Tabs.Tab>
        <Tooltip color="red" disabled={!form.errors.tasks} label={form.errors.tasks}>
          <Tabs.Tab value="tasks"><Text c={form.errors.tasks?"red":undefined} size="sm" >Tasks</Text></Tabs.Tab>
        </Tooltip>
        <Tooltip color="red" disabled={!form.errors.triggers} label={form.errors.triggers}>
          <Tabs.Tab value="triggers"><Text c={form.errors.triggers?"red":undefined} size="sm" >Triggers</Text></Tabs.Tab>
        </Tooltip>
      </Tabs.List>
      <Tabs.Panel value="general"><General form={form} /></Tabs.Panel>
      <Tabs.Panel value="tasks"><TaskTab form={form} /></Tabs.Panel>
      <Tabs.Panel value="triggers"><TriggerTab form={form} /></Tabs.Panel>
    </Tabs>
    {!!success&&<Alert mt="xs" icon={<IconCheck size={32} />} color="green">Action config {adding ? "added" : "updated"} successfully.</Alert>}
    {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
    <Group justify={"flex-end"} mt="md">
          <Button loading={loading} onClick={()=>adding?post():put()}>{adding ? "Add" : "Save"}</Button>
    </Group>
    </>
  )
}

export default function Editor({ open, adding, close, refresh }: { open?: Schedule, adding?: boolean, close(): void, refresh(): void }) {
  return (
    <Modal opened={!!open} onClose={close} size="xl" title={adding ? "New Schedule" : "Edit Schedule"} closeOnClickOutside={!adding} >
      {open&&<Content open={open} refresh={refresh} adding={adding} close={close} />}
    </Modal>
  );
}