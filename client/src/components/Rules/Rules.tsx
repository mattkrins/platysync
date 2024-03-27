import { useContext, useEffect, useState } from 'react';
import SchemaContext from '../../providers/SchemaContext';
import Container from '../Common/Container';
import Head from '../Common/Head';
import { Button, Group, Text, ActionIcon, useMantineTheme, Switch, Grid, Tooltip, Divider } from '@mantine/core';
import { IconCopy, IconGripVertical, IconInfoCircle, IconPencil, IconPlayerPlay, IconTrash } from '@tabler/icons-react';
import { useDisclosure, useListState } from '@mantine/hooks';
import useAPI, { handleError } from '../../hooks/useAPI.ts';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { availableActions } from '../../modules/common.ts';
import Editor from './Editor/Editor.tsx';
import RunModal from './Run/Run.tsx';
import classes from '../../Theme.module.css';

function RuleIcons({ actions }: { actions: Action[] }) {
  const theme = useMantineTheme();
  return (actions||[]).map((action, i)=>{
    const { Icon, color } = availableActions[action.name];
    return (
    <Tooltip key={i} fz="xs" withArrow color={color?theme.colors[color][6]:undefined} label={action.name}>
      <Icon color={color?theme.colors[color][6]:undefined} size={16} stroke={2} />
    </Tooltip>)
  })
}

export default function Rules() {
  const { schema, rules, mutate } = useContext(SchemaContext);
  const [opened, { open, close }] = useDisclosure(false);
  const [ running, setRunning ] = useState<Rule|undefined>(undefined);
  const [ editing, setEditing ] = useState<Rule|undefined>(undefined);
  const edit = (rule: Rule) => { setEditing(rule); open(); }
  const run = (rule: Rule) => { setRunning(rule); };
  const { del, request: r1, loading: l1 } = useAPI({
    cleanup: true,
    furl: ({name}:{name:string}) => `/schema/${schema?.name}/rule/${name}`,
    fdata: ({name}:{name:string}) => ({ name }),
    catch: (e) => handleError(e),
    then: ({rules, _rules}) => {
        mutate({rules, _rules});
        notifications.show({ title: "Success",message: 'Rule Removed.', color: 'lime', });
    },
  });
  const { post: copy, request: r2, loading: l2 } = useAPI({
    cleanup: true,
    furl: ({name}:{name:string}) => `/schema/${schema?.name}/rule/${name}/copy`,
    fdata: ({name}:{name:string}) => ({ name }),
    catch: (e) => handleError(e),
    then: ({rules, _rules}) => {
        mutate({rules, _rules});
        notifications.show({ title: "Success",message: 'Rule Copied.', color: 'lime', });
    },
  });
  const { put: tog, loading: l4 } = useAPI({
    cleanup: true,
    furl: ({name}:{name:string}) => `/schema/${schema?.name}/rule/${name}/toggle`,
    fdata: ({name}:{name:string}) => ({ name }),
    catch: (e) => handleError(e),
    then: ({rules, _rules}) => {
        mutate({rules, _rules});
    },
  });
  const { put, loading: l3 } = useAPI({
    cleanup: true,
    url: `/schema/${schema?.name}/rules/reorder`,
    then: ({rules}) => {
        mutate({rules});
    },
  });
  const remove = (name: string) =>
  modals.openConfirmModal({
      title: 'Permanently Delete Rule',
      centered: true,
      children: (
      <Text size="sm">
          Are you sure you want to delete {name}? This action is destructive and cannot be reversed.
      </Text>
      ),
      labels: { confirm: 'Delete rule', cancel: "No don't delete it" },
      confirmProps: { color: 'red' },
      onConfirm: () => del({name}),
  });
  
  const loading = l1||l2||l3||l4;

  const [state, handlers] = useListState(rules);
  useEffect(()=>handlers.setState(rules), [rules]);

  const reorder = (from:number,to:number) => {
    handlers.reorder({ from, to });
    put({data: { from, to }});
  }

  const toggle = (item: Rule) => {
    handlers.setState(rules.map(r=>r.name!==item.name?r:{...r, enabled: !item.enabled }));
    tog({name: item.name});
  }

  if (!schema) return;
  return (
  opened?<Editor editing={editing} close={()=>{close();setEditing(undefined);}} />:
  <Container label={<Head rightSection={<Button onClick={()=>open()} variant="light" >Add</Button>} >Rules</Head>} >
      <RunModal rule={running} close={()=>setRunning(undefined)} />
      {state.length===0&&<Text c="lighter" size="sm" >No Rules in effect.</Text>}
      <DragDropContext onDragEnd={({ destination, source }) => reorder( source.index, destination?.index || 0 ) } >
          <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                {state.map((item, index) => (
                <Draggable key={index} index={index} draggableId={index.toString()}>
                    {(provided) => (
                    <Grid align="center" ref={provided.innerRef} mt="xs" {...provided.draggableProps} className={classes.item}
                    style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
                    >
                        <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                            <Group><IconGripVertical size="1.2rem" /></Group>
                        </Grid.Col>
                        <Grid.Col span="auto">
                          <Group gap={5} >
                            {item.name}{item.description&&item.description!==""&&
                            <Tooltip position="right" label={item.description}><IconInfoCircle size={16} /></Tooltip>}
                          </Group>
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <Group>
                              <RuleIcons actions={item.before_actions} />
                              {(item.before_actions||[]).length>0&&<Divider orientation="vertical" />}
                              <RuleIcons actions={item.actions} />
                              {(item.after_actions||[]).length>0&&<Divider orientation="vertical" />}
                              <RuleIcons actions={item.after_actions} />
                            </Group>
                        </Grid.Col>
                        <Grid.Col span="content">
                            <Group justify="right" gap="xs">
                                <Switch disabled={loading} onClick={()=>toggle(item)} checked={item.enabled} color="teal" />
                                <ActionIcon disabled={loading} loading={r1.name===item.name} onClick={()=>remove(item.name)} variant="subtle" color="red"><IconTrash size={16} stroke={1.5} /></ActionIcon>
                                <ActionIcon disabled={loading} loading={r2.name===item.name} onClick={()=>copy({name: item.name})} variant="subtle" color="indigo"><IconCopy size={16} stroke={1.5} /></ActionIcon>
                                <ActionIcon disabled={loading} onClick={()=>edit(item)} variant="subtle" color="orange"><IconPencil size={16} stroke={1.5} /></ActionIcon>
                                <ActionIcon disabled={loading} onClick={()=>run(item)} variant="subtle" color="green"><IconPlayerPlay size={16} stroke={1.5} /></ActionIcon>
                            </Group>
                        </Grid.Col>
                    </Grid>
                    )}
                </Draggable>
                ))}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
      </DragDropContext>
  </Container>
  )
}
