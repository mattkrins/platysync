import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useMantineTheme, Box, Group, Button, Grid, ActionIcon, Text, NavLink, Popover, Collapse, Divider } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconChevronDown, IconGripVertical, IconTrash, IconCopy, IconPencil, IconCode } from "@tabler/icons-react";
import { useContext } from "react";
import ExplorerContext from "../../../providers/ExplorerContext";
import { useDisclosure } from "@mantine/hooks";
import { availableActions, availableCatagories } from "../../../data/common";
import classes from './Actions.module.css';

function ActionGroup({add, perRule, label}:{add: (name: string) => void, perRule?: boolean, label: string}) {
  const [opened, { close, open }] = useDisclosure(false);
  const theme = useMantineTheme();
  const operations = Object.values(availableActions);
  const _add = (id: string) => () => { add(id); close(); };
  return ( //TODO - hide Directory Operations etc when not ldap
  <Group justify="right" gap="xs">
  <Popover width={300} position="left-start" shadow="md" opened={opened}>
  <Popover.Target>
      <Button variant="light" onClick={opened?close:open} rightSection={<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12}>{label}</Button>
  </Popover.Target>
  <Popover.Dropdown>
      {availableCatagories.map(cat=>{
      const filtered = operations.filter(action=>(perRule?action.perRule!==false&&action.catagory===cat.id:action.catagory===cat.id));
      if (filtered.length<=0) return;
      return (<NavLink key={cat.id} label={cat.label} className={classes.control}
      leftSection={<cat.Icon color={cat.color?theme.colors[cat.color][6]:undefined} size="1rem" stroke={1.5} />}
      childrenOffset={28}
      >
        {filtered.map(action=>
          <NavLink key={action.id} label={action.label||action.id} className={classes.control} onClick={_add(action.id)}
          leftSection={<action.Icon color={action.color?theme.colors[action.color][6]:undefined} size="1rem" stroke={1.5} />}/>
        )}
      </NavLink>)})}
  </Popover.Dropdown>
  </Popover>
</Group>)
}

function Action ( { form, index, a, explore, actionType }: {form: UseFormReturnType<Rule>, index: number, a: Action, explore: explore, actionType: string } ){
  const [opened, { toggle }] = useDisclosure(false);
  const theme = useMantineTheme();
  const { Icon, color, Component } = availableActions[a.name];
  const copy = (v: Action) => () => form.insertListItem(actionType, {...v});
  const remove  = (index: number) => () => form.removeListItem(actionType, index);
  
  const actions = form.values[actionType] as Action[];
  const modifyCondition = (key: string)=> () => explore(() => (value: string) =>
  form.setFieldValue(`${actionType}.${index}.${key}`,
  `${actions[index][key]||''}{{${value}}}`) );
  const explorer = (key: string) => <ActionIcon
  onClick={modifyCondition(key)}
  variant="subtle" ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }} />
  </ActionIcon>

  return (<>
    <Grid.Col span="auto">{index+1}. <Icon color={color?theme.colors[color][6]:undefined} size={18} stroke={1.5} /> {a.name}</Grid.Col>
    <Grid.Col span="content">
        <Group justify="right" gap="xs">
            <ActionIcon onClick={()=>toggle()} variant={opened?"filled":"default"} size="lg"><IconPencil size={15}/></ActionIcon>
            <ActionIcon onClick={remove(index)} variant="default" size="lg"><IconTrash size={15}/></ActionIcon>
            <ActionIcon onClick={copy(a)} variant="default" size="lg"><IconCopy size={15}/></ActionIcon>
        </Group>
    </Grid.Col>
    <Grid.Col span={12} pt={0} pb={0} >
      <Collapse in={opened}>
        <Component form={form} index={index} explorer={explorer} explore={explore} actionType={actionType} />
      </Collapse>
    </Grid.Col>
  </>
  )
}

function ActionList( { form, actionType }: {form: UseFormReturnType<Rule>, actionType: string} ) {
  const { explorer, explore } = useContext(ExplorerContext);
  const nonExplorer = (k:(d: string) => void) => k;
  const actions = form.values[actionType] as Action[];
  return (
    <Box>
        {explorer}
        <DragDropContext
        onDragEnd={({ destination, source }) => form.reorderListItem(actionType, { from: source.index, to: destination? destination.index : 0 }) }
        >
        <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
            {actions.map((a, index)=>
            <Draggable key={index} index={index} draggableId={index.toString()}>
              {(provided) => (
              <Grid align="center" ref={provided.innerRef} mt="xs" {...provided.draggableProps} gutter="xs"
              style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
              >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Action form={form} index={index} a={a} actionType={actionType} explore={actionType!=="actions"?nonExplorer:explore} />
              </Grid>)}
            </Draggable>
            )}
            {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Box>
  )
}


export default function Actions( { form }: {form: UseFormReturnType<Rule>} ) {
  const add = (name: string) => form.insertListItem('actions', { name });
  const addBeforeRule = (name: string) => form.insertListItem('before_actions', { name });
  const addAfterRule = (name: string) => form.insertListItem('after_actions', { name });
  return (
    <Box>
        <Text c="dimmed" size="sm" mt="md" >Actions on this tab are executed sequentially if all conditions evaluated successfully.</Text>
        <Divider label={<ActionGroup add={addBeforeRule} label="Initial Action" perRule />} labelPosition="right" />
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem('before_actions', { from: source.index, to: destination? destination.index : 0 }) } >
          <ActionList form={form} actionType={"before_actions"} />
        </DragDropContext>
        <Divider my="xs" label={<ActionGroup add={add} label="Row Action" />} labelPosition="right" />
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem('actions', { from: source.index, to: destination? destination.index : 0 }) } >
          <ActionList form={form} actionType={"actions"} />
        </DragDropContext>
        <Divider my="xs" label={<ActionGroup add={addAfterRule} label="Final Action" perRule />} labelPosition="right" />
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem('after_actions', { from: source.index, to: destination? destination.index : 0 }) } >
          <ActionList form={form} actionType={"after_actions"} />
        </DragDropContext>

    </Box>
  )
}
