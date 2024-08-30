import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Button, Center, Grid, Group, Modal, MultiSelect, NumberInput, Select, Switch, Tabs, Textarea, TextInput } from "@mantine/core";
import { isNotEmpty, useForm, UseFormReturnType } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconBraces, IconCheckbox, IconCopy, IconGripVertical, IconPencil, IconPlus, IconTag, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import MenuTip from "../../components/MenuTip";
import { useSelector } from "../../hooks/redux";
import { getRules } from "../../providers/schemaSlice";

const validate = {
  name: isNotEmpty('Name can not be empty.'),
}

function TriggerTab({ form }: { form: UseFormReturnType<Schedule> } ) {
  const triggers = form.getInputProps("triggers").value as [];
  return <>Triggers</>
}

function Task({ form, index, entry, path }: { form: UseFormReturnType<Schedule>, index: number, entry: Schedule, path: string } ) {
  const copy = () => form.insertListItem(path, structuredClone(entry));
  const remove = () => form.removeListItem(path, index);
  return (
  <Draggable index={index} draggableId={String(index)}>
      {provided => (
          <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps}
          style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
          ref={provided.innerRef} >
              <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                  <Group><IconGripVertical size="1.2rem" /></Group>
              </Grid.Col>
              <Grid.Col span="auto" >
                  <TextInput {...form.getInputProps(`${path}.${index}.key`)}
                  leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                  placeholder="Key"
                  />
              </Grid.Col>
              <Grid.Col span="auto" >
                  <TextInput {...form.getInputProps(`${path}.${index}.value`)}
                  leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                  placeholder="Value"
                  />
              </Grid.Col>
              <Grid.Col span="content">
                  <Group justify="right" gap="xs">
                      <MenuTip label="Copy" Icon={IconCopy} onClick={copy} variant="default" />
                      <MenuTip label="Delete" Icon={IconTrash} onClick={remove} variant="default" />
                  </Group>
              </Grid.Col>
          </Grid>
      )}
  </Draggable>)
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
      label="Rules" leftSection={<IconCheckbox size={15} />}
      placeholder={ (Array.isArray(selected_rules) && selected_rules.length > 0) ? "Pick rules":"All rules"}
      data={rules.map(r=>r.name)}
      {...form.getInputProps("rules")}
    />}
    <Group justify={"flex-end"} mt="md">
          <Button onClick={()=>adding?add():edit()}>{adding ? "Add" : "Save"}</Button>
    </Group>
  </>)
}

function TaskTab({ form }: { form: UseFormReturnType<Schedule> } ) {
  const [ editing, setEditing ] = useState<number>();
  const [ task, setTask ] = useState<Task>();
  const entries = form.getInputProps("tasks").value as Schedule[];
  const close = () => { setTask(undefined); setEditing(undefined); }
  const add = () => setTask({ name: "", rules: [] });
  return (
  <>
    <Modal opened={!!task} onClose={close} size="md" title={editing ? "Edit Task" : "New Task"}>
      {task&&<TaskEditor open={task} close={close} task_form={form}  adding={!editing} />}
    </Modal>
    <Group justify="end" mt="xs" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Task</Button></Group>
    {entries.length===0&&<Center c="dimmed" fz="xs" >No tasks configured.</Center>}
    <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem("tasks", { from: source.index, to: destination? destination.index : 0 }) } >
        <Droppable droppableId="dnd-list" direction="vertical">
        {(provided) => (
        <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
            {entries.map((entry, index) => <Task key={index} index={index} entry={entry} form={form} path={"tasks"} />)}
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
    <Modal opened={!!open} onClose={close} size="xl" title={adding ? "New Schedule" : "Edit Schedule"}>
      {open&&<Content open={open} refresh={refresh} adding={adding} close={close} />}
    </Modal>
  );
}