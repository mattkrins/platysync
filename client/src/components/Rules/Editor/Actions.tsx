import { useContext, useMemo } from "react";
import { useMantineTheme, Box, Group, Button, Grid, ActionIcon, Text, NavLink, Popover, Collapse, Divider, Input } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { IconChevronDown, IconGripVertical, IconTrash, IconCopy, IconPencil } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import SchemaContext from "../../../providers/SchemaContext2";
import { availableActions, availableCatagories } from "../../../modules/common";
import classes from './Actions.module.css';
import useTemplater from "../../../hooks/useTemplater";
import AuthContext from '../../../providers/AppContext';

function ActionGroup({add, perRule, label, sources = []}:{add: (name: string) => void, perRule?: boolean, label: string, sources: string[]}) {
  const [opened, { close, open }] = useDisclosure(false);
  const { connectors } = useContext(SchemaContext);
  const { settings } = useContext(AuthContext);
  const theme = useMantineTheme();
  const _add = (id: string) => () => { add(id); close(); };

  const sourceIDs = connectors.filter(c=>sources.includes(c.name)).map(c=>c.id);

  const availableActions_ = availableActions
  .filter(a=>{ return !a.requires || sourceIDs.includes(a.requires) })
  .filter(c=>perRule?!c.perRule:true)
  .filter(c=>c.id!=="Run Command"?true:settings.enableRun);

  const availableCatagories_ = availableCatagories
  .filter(a=>{ return !a.requires || a.requires.find(r=>sourceIDs.includes(r)) })
  .filter(c=>perRule?!c.perRule:true);

  return (
  <Group justify="right" gap="xs">
    <Popover width={300} position="left-start" shadow="md" opened={opened}>
    <Popover.Target>
        <Button variant="light" onClick={opened?close:open} rightSection={<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12}>{label}</Button>
    </Popover.Target>
    <Popover.Dropdown>
      {availableCatagories_.map(cat=>
      <NavLink key={cat.id} label={cat.label} className={classes.control}
      leftSection={<cat.Icon color={cat.color?theme.colors[cat.color][6]:undefined} size="1rem" stroke={1.5} />}
      >
      {availableActions_.filter(a=>a.catagory===cat.id).map(action=>
        <NavLink key={action.id} label={action.label||action.id} className={classes.control} onClick={_add(action.id)}
        leftSection={<action.Icon color={action.color?theme.colors[action.color][6]:undefined} size="1rem" stroke={1.5} />}/>
      )}
      </NavLink>)}
    </Popover.Dropdown>
    </Popover>
  </Group>)
}

function Action( { form, index, a, actionType, templateProps }: {form: UseFormReturnType<Rule>, index: number, a: Action, actionType: string, templateProps: templateProps } ){
  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure(false);
  const [editingName, { open, close }] = useDisclosure(false);
  const x = availableActions.find(action=>action.id===a.name);

  const copy = (v: Action) => () => form.insertListItem(actionType, {...v});
  const remove  = (index: number) => () => form.removeListItem(actionType, index);
  const taken = (form.values.secondaries||[]).map(s=>s.primary);
  const sources = [form.values.primary, ...taken];

  const templates: string[] = useMemo(()=>{
    const t: string[] = [];
    const allActions = 
    actionType==="before_actions" ? form.values.before_actions||[] : 
    actionType==="actions" ? [...form.values.before_actions||[], ...form.values.actions||[]] : 
    actionType==="after_actions" ? [...form.values.before_actions||[], ...form.values.actions||[], ...form.values.after_actions||[]] : [];
    for (const action of allActions){
      switch (action.name) {
        case "Encrypt String":{ t.push(action.target as string); break; }
        case "API Request":{ t.push(action.response as string); break; }
        case "Comparator":{ t.push(action.target as string); break; }
        case "Template": {
          for (const template of action.templates||[]) {
            if (!template.name || template.name.trim()==="") continue;
            t.push(template.name);
          }
        break; }
        default: break;
      }
    } return t;
  }, [ form.values.before_actions, form.values.actions, form.values.after_actions ]);
  if (!x) return <></>;
  const { Icon, color, Component } = x;
  return (<>
    <Grid.Col span="auto">
      <Group>
        {index+1}. <Icon color={color?theme.colors[color][6]:undefined} size={18} stroke={1.5} />
        <Input variant="unstyled" size="md" radius={0}
        styles={editingName?{input:{borderBottom:"1px solid var(--mantine-color-default-border)"}}:undefined}
        {...form.getInputProps(`${actionType}.${index}.displayName`)}
        onFocus={open}
        value={((form.values[actionType] as Action[])[index].displayName as string)||a.name}
        onBlur={(e)=>{
          close();
          if (e.target.value==="") form.setFieldValue(`${actionType}.${index}.displayName`, a.name)
        }}
        />
          
        
      </Group>
      </Grid.Col>
    <Grid.Col span="content">
        <Group justify="right" gap="xs">
            <ActionIcon onClick={()=>toggle()} variant={opened?"filled":"default"} size="lg"><IconPencil size={15}/></ActionIcon>
            <ActionIcon onClick={remove(index)} variant="default" size="lg"><IconTrash size={15}/></ActionIcon>
            <ActionIcon onClick={copy(a)} variant="default" size="lg"><IconCopy size={15}/></ActionIcon>
        </Group>
    </Grid.Col>
    <Grid.Col span={12} pt={0} pb={0} >
      <Collapse in={opened}>
        <Component form={form} index={index} templateProps={templateProps} actionType={actionType} sources={sources} templates={templates }  />
      </Collapse>
    </Grid.Col>
  </>
  )
}

function ActionList( { form, actionType, templateProps }: {form: UseFormReturnType<Rule>, actionType: string, templateProps: templateProps} ) {
  const actions = form.values[actionType] as Action[];
  return (
    <Box>
        <DragDropContext
        onDragEnd={({ destination, source }) => form.reorderListItem(actionType, { from: source.index, to: destination? destination.index : 0 }) }
        >
        <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
            {actions.map((a, index)=>
            <Draggable key={index} index={index} draggableId={index.toString()}>
              {(provided) => (
              <Grid align="center" ref={provided.innerRef} {...provided.draggableProps} gutter="xs"
              style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
              >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Action form={form} index={index} a={a} actionType={actionType} templateProps={templateProps} />
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


export default function Actions( { form, allow, templates }: {form: UseFormReturnType<Rule>, allow: string[], templates: string[]  } ) {
  const add = (name: string) => form.insertListItem('actions', { name, displayName: name });
  const addBeforeRule = (name: string) => form.insertListItem('before_actions', { name, displayName: name });
  const addAfterRule = (name: string) => form.insertListItem('after_actions', { name, displayName: name });
  const { templateProps, explorer } = useTemplater({allow, templates});
  
  return (
    <Box>
      {explorer}
      <Text c="dimmed" size="sm" mt="md" >Actions on this tab are executed sequentially if all conditions evaluated successfully.</Text>
      <Divider label={<ActionGroup add={addBeforeRule} label="Initial Action" sources={allow} perRule />} labelPosition="right" />
      <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem('before_actions', { from: source.index, to: destination? destination.index : 0 }) } >
        <ActionList form={form} templateProps={templateProps} actionType={"before_actions"} />
      </DragDropContext>
      <Divider my="xs" label={<ActionGroup add={add} label="Row Action" sources={allow} />} labelPosition="right" />
      <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem('actions', { from: source.index, to: destination? destination.index : 0 }) } >
        <ActionList form={form} templateProps={templateProps} actionType={"actions"} />
      </DragDropContext>
      <Divider my="xs" label={<ActionGroup add={addAfterRule} label="Final Action" sources={allow} perRule />} labelPosition="right" />
      <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem('after_actions', { from: source.index, to: destination? destination.index : 0 }) } >
        <ActionList form={form} templateProps={templateProps} actionType={"after_actions"} />
      </DragDropContext>
    </Box>
  )
}
