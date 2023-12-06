import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useMantineTheme, Box, Group, Button, Grid, ActionIcon, Text, NavLink, Popover, Collapse } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconChevronDown, IconGripVertical, IconTrash, IconCopy, IconPencil, IconCode } from "@tabler/icons-react";
import { useContext } from "react";
import ExplorerContext from "../../../providers/ExplorerContext";
import { useDisclosure } from "@mantine/hooks";
import { availableActions, availableCatagories } from "../../../data/common";
import classes from './Actions.module.css';
import WritePDF from "./Operations/DocWritePDF";
import EnableUser from "./Operations/DirEnableUser";
import Print from "./Operations/DocPrint";
import CreateUser from "./Operations/DirCreateUser";
import Template from "./Operations/SysTemplate";
import DeleteFile from "./Operations/FileDelete";
import MoveFile from "./Operations/FileMove";
import CopyFile from "./Operations/FileCopy";
import CopyFolder from "./Operations/FolderCopy";
import MoveFolder from "./Operations/FolderMove";
import DeleteFolder from "./Operations/FolderDelete";
import MoveOU from "./Operations/DirMoveOU";
import UpdateAttributes from "./Operations/DirUpdateAtt";

function ActionGroup({add}:{add: (name: string) => void}) {
  const [opened, { close, open }] = useDisclosure(false);
  const theme = useMantineTheme();
  const operations = Object.values(availableActions);
  const _add = (id: string) => () => { add(id); close(); };
  return ( //TODO - hide Directory Operations etc when not ldap
  <Group justify="right" gap="xs">
  <Popover width={300} position="left-start" shadow="md" opened={opened}>
  <Popover.Target>
      <Button variant="light" onClick={opened?close:open} rightSection={<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12}>Add Action</Button>
  </Popover.Target>
  <Popover.Dropdown>
      {availableCatagories.map(cat=>
      <NavLink key={cat.id} label={cat.label} className={classes.control}
      leftSection={<cat.Icon color={cat.color?theme.colors[cat.color][6]:undefined} size="1rem" stroke={1.5} />}
      childrenOffset={28}
      >
        {operations.filter(action=>action.catagory===cat.id).map(action=>
          <NavLink key={action.id} label={action.label||action.id} className={classes.control} onClick={_add(action.id)}
          leftSection={<action.Icon color={action.color?theme.colors[action.color][6]:undefined} size="1rem" stroke={1.5} />}/>
        )}
      </NavLink>)}
  </Popover.Dropdown>
  </Popover>
</Group>)
}

function Action ( { form, index, a, explore }: {form: UseFormReturnType<Rule>, index: number, a: Action, explore: explore } ){
  const [opened, { toggle }] = useDisclosure(false);
  const theme = useMantineTheme();
  const { Icon, color } = availableActions[a.name];
  const copy = (v: Action) => () => form.insertListItem('actions', {...v});
  const remove  = (index: number) => () => form.removeListItem('actions', index);

  const modifyCondition = (key: string)=> () => explore(() => (value: string) =>
  form.setFieldValue(`actions.${index}.${key}`, `${form.values.actions[index][key]||''}{{${value}}}`) );
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
          {{
            'Send To Printer': <Print form={form} index={index} explorer={explorer} />,
            'Write PDF': <WritePDF form={form} index={index} explorer={explorer} />,
            'Enable User': <EnableUser form={form} index={index} explorer={explorer} />,
            'Disable User': <EnableUser form={form} index={index} explorer={explorer} />,
            'Delete User': <EnableUser form={form} index={index} explorer={explorer} />,
            'Move Organisational Unit': <MoveOU form={form} index={index} explorer={explorer} />,
            'Create User': <CreateUser form={form} index={index} explorer={explorer} explore={explore} />,
            'Update Attributes': <UpdateAttributes form={form} index={index} explorer={explorer} explore={explore} />,
            //TODO - update groups
            'Delete File': <DeleteFile form={form} index={index} explorer={explorer} />,
            'Move File': <MoveFile form={form} index={index} explorer={explorer} />,
            'Copy File': <CopyFile form={form} index={index} explorer={explorer} />,
            'Copy Folder': <CopyFolder form={form} index={index} explorer={explorer} />,
            'Move Folder': <MoveFolder form={form} index={index} explorer={explorer} />,
            'Delete Folder': <DeleteFolder form={form} index={index} explorer={explorer} />,
            'Template': <Template form={form} index={index} explore={explore} />,
            //NOTE - Should work in theory, but not currently implemented due to arbitrary code execution vulnerability concerns:
            //LINK - client\src\components\Rules\Editor\Operations\SysRunCommand.tsx
            //'Run Command': <RunCommand form={form} index={index} explore={explore} />,
          }[a.name]}
      </Collapse>
    </Grid.Col>
  </>
  )
}

export default function Actions( { form }: {form: UseFormReturnType<Rule>} ) {
  const { explorer, explore } = useContext(ExplorerContext);
  const add = (name: string) => form.insertListItem('actions', { name });
  return (
    <Box>
        {explorer}
        <Group grow justify="apart" mb="xs" mt="xs" gap="xs">
            <Text c="dimmed" size="sm" >Actions will be executed sequentially if all conditions evaluated successfully.</Text>
            <ActionGroup add={add} />
        </Group>
        {(form.values.actions||[]).length===0&&<Text c="lighter" size="sm" >No actions to perform.</Text>}
        <DragDropContext
        onDragEnd={({ destination, source }) => form.reorderListItem('actions', { from: source.index, to: destination? destination.index : 0 }) }
        >
        <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
            {(form.values.actions||[]).map((a, index)=>
            <Draggable key={index} index={index} draggableId={index.toString()}>
              {(provided) => (
              <Grid align="center" ref={provided.innerRef} mt="xs" {...provided.draggableProps} gutter="xs"
              style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
              >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Action form={form} index={index} a={a} explore={explore} />
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
