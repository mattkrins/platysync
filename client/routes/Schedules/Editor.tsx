import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Button, Center, Grid, Group, Modal, MultiSelect, NumberInput, Paper, Select, Switch, Tabs, Textarea, TextInput, Text } from "@mantine/core";
import { isNotEmpty, useForm, UseFormReturnType } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconBraces, IconCheckbox, IconCopy, IconEdit, IconGripVertical, IconPencil, IconPlus, IconTag, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import MenuTip from "../../components/MenuTip";
import { useSelector } from "../../hooks/redux";
import { getRules } from "../../providers/schemaSlice";
import useEditor from "../../hooks/useEditor";

const validate = {
  name: isNotEmpty('Name can not be empty.'),
}

function TriggerTab({ form }: { form: UseFormReturnType<Schedule> } ) {
  const triggers = form.getInputProps("triggers").value as [];
  return <>Triggers</>
}

function TaskEditor({ open, adding, close, task_form, index }: { open: Task, adding?: boolean, close(): void, task_form: UseFormReturnType<Schedule>, index?: number } ) {
  const form = useForm<Task>({ validate: {
    name: isNotEmpty('Task name can not be empty.'),
  }, initialValues: structuredClone(open) });
  const rules = useSelector(getRules);
  const name = form.getInputProps("name").value;
  const selected_rules = form.getInputProps("rules").value as string[];
  const invalid = () => { form.validate(); return !form.isValid(); }
  const add = () => { if (invalid()) return; task_form.insertListItem("tasks", form.getValues() ); close(); }
  const edit = () => { if (invalid()) return; task_form.setFieldValue(`tasks.${index}`, form.getValues()); close(); }
  return (
  <>
    <Select
      label="Task" withAsterisk
      placeholder="Select a task to run"
      data={['Run Rules']}
      {...form.getInputProps("name")}
    />
    {name==="Run Rules"&&<MultiSelect
      label="Rules" leftSection={<IconCheckbox size={16} />}
      placeholder={ (Array.isArray(selected_rules) && selected_rules.length > 0) ? "Pick rules":"All rules"}
      data={rules.map(r=>r.name)}
      {...form.getInputProps("rules")}
    />}
    <Group justify={"flex-end"} mt="md">
          <Button onClick={()=>adding?add():edit()}>{adding ? "Add" : "Save"}</Button>
    </Group>
  </>)
}

function Task({ form, index, entry, path, edit }: { form: UseFormReturnType<Schedule>, index: number, entry: Task, path: string, edit(task: Task, i: number): void } ) {
  const copy = () => form.insertListItem(path, structuredClone(entry));
  const remove = () => form.removeListItem(path, index);
  const details = (entry.rules||[]).length > 0 ? `${(entry.rules||[]).join(', ')}` : `[ All ]`;
  return (
  <Draggable index={index} draggableId={String(index)}>
      {provided => (
        <Paper withBorder mb="xs" {...provided.draggableProps} style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }} ref={provided.innerRef}>
          <Grid align="center" gutter="xs" p="xs" >
              <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                  <Group><IconGripVertical size="1.2rem" /></Group>
              </Grid.Col>
              <Grid.Col span={4} >{entry.name}</Grid.Col>
              <Grid.Col span={4} ><Text truncate="end">{details}</Text></Grid.Col>
              <Grid.Col span={3}>
                  <Group justify="right" gap="xs">
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
  const entries = form.getInputProps("tasks").value as Schedule[];
  const [ task, isEditing, { editing, add, close, edit } ] =  useEditor<Task, number>({ name: "", rules: [] });
  return (
  <>
    <Modal opened={!!task} onClose={close} size="md" title={isEditing ? "Edit Task" : "New Task"}>
      {task&&<TaskEditor open={task} close={close} task_form={form} adding={!isEditing} index={editing} />}
    </Modal>
    <Paper mb="xs" p="xs" mt="xs" withBorder >
        <Grid justify="space-between" align="center">
            <Grid.Col span={1}/>
            <Grid.Col span={4}>Name</Grid.Col>
            <Grid.Col span={4}>Details</Grid.Col>
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

function Content({ open: schedule, refresh, adding, close }: { open: Schedule, refresh(): void, adding?: boolean, close(): void }) {
  const form = useForm<Schedule>({ validate, initialValues: structuredClone(schedule) });
  return (
    <Tabs defaultValue="general">
      <Tabs.List grow>
        <Tabs.Tab value="general">General</Tabs.Tab>
        <Tabs.Tab value="tasks">Tasks</Tabs.Tab>
        <Tabs.Tab value="triggers">Triggers</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="general"><General form={form} /></Tabs.Panel>
      <Tabs.Panel value="tasks"><TaskTab form={form} /></Tabs.Panel>
      <Tabs.Panel value="triggers"><TriggerTab form={form} /></Tabs.Panel>
    </Tabs>
  )
}

export default function Editor({ open, adding, close, refresh }: { open?: Schedule, adding?: boolean, close(): void, refresh(): void }) {
  return (
    <Modal opened={!!open} onClose={close} size="xl" title={adding ? "New Schedule" : "Edit Schedule"} closeOnClickOutside={!adding} >
      {open&&<Content open={open} refresh={refresh} adding={adding} close={close} />}
    </Modal>
  );
}