import { ActionIcon, Box, Button, Grid, Group, Loader, Paper, Switch, rem, Text, useMantineTheme, Tooltip, Divider } from "@mantine/core";
import { IconCopy, IconGripVertical, IconPencil, IconPlayerPlay, IconPlus, IconTrash } from "@tabler/icons-react";
import Container from "../Common/Container";
import Head from "../Common/Head";
import { useContext, useState } from "react";
import SchemaContext from "../../providers/SchemaContext2";
import { DragDropContext, Droppable, Draggable, DraggableProvided } from "@hello-pangea/dnd";
import useAPI from "../../hooks/useAPI2";
import RunModal from "./Run/Run";
import { modals } from "@mantine/modals";
import Editor from "./Editor/Editor";
import { useDisclosure } from "@mantine/hooks";
import { availableActions } from "../../modules/common";
import providers from "../Connectors/providers";


function RuleIcons({ actions }: { actions: Action[] }) {
  const theme = useMantineTheme();
  return (actions||[]).map((a, i)=>{
    const action = availableActions.find(av=>av.id===a.name);
    if (!action) return <></>;
    return (
    <Tooltip key={i} fz="xs" withArrow color={action.color?theme.colors[action.color][6]:undefined} label={a.name}>
      <action.Icon color={action.color?theme.colors[action.color][6]:undefined} size={16} stroke={2} />
    </Tooltip>)
  })
}


function RuleConnectors({ item }: { item: Rule }) {
  const theme = useMantineTheme();
  const { connectors } = useContext(SchemaContext);
  const providerMap = connectors.filter(c=>providers[c.id]&&([item.primary, ...item.secondaries.map(s=>s.primary)].includes(c.name))).map(c=>({...c, provider: providers[c.id] }))
  return providerMap.map(c=><Tooltip key={c.name} fz="xs" withArrow color={c.provider.color?theme.colors[c.provider.color][6]:undefined} label={c.name}>
    <c.provider.Icon color={c.provider.color?theme.colors[c.provider.color][6]:undefined} size={16} stroke={2} />
  </Tooltip>)
}

interface ItemProps {
  provided: DraggableProvided;
  item: Rule, disabled?: boolean;
  loading?: boolean;
  remove(): void;
  run(): void;
  toggle(): void;
  copy(): void;
  edit(): void;
}
function Item( { provided, item, disabled, loading, remove, toggle, run, copy, edit }: ItemProps ) {
  return (
  <Paper mb="xs" p="xs" withBorder ref={provided.innerRef} {...provided.draggableProps}
  style={{ ...provided.draggableProps.style, cursor: loading ? "not-allowed" : undefined }}
  >
      <Grid justify="space-between" align="center">
          <Grid.Col span={1} style={{ cursor: loading ? undefined : 'grab' }} {...provided.dragHandleProps} >
              <Group wrap="nowrap" justify="space-between" >
                  {loading?<Loader size="sm" />:<IconGripVertical stroke={1.5} />}
              </Group>
          </Grid.Col>
          <Grid.Col span={3} c={disabled?"dimmed":undefined}>
              {item.name}
          </Grid.Col>
          <Grid.Col span={4}>
            <Group gap={5}>
              <RuleConnectors item={item} />
              <Divider orientation="vertical" />
              <RuleIcons actions={item.before_actions} />
              {(item.before_actions||[]).length>0&&<Divider orientation="vertical" />}
              <RuleIcons actions={item.actions} />
              {(item.after_actions||[]).length>0&&<Divider orientation="vertical" />}
              <RuleIcons actions={item.after_actions} />
            </Group>
          </Grid.Col>
          <Grid.Col span={3}>
              <Group gap="xs" justify="flex-end">
                <Switch onClick={()=>toggle()} disabled={loading} checked={item.enabled} color="teal" />
                <ActionIcon disabled={disabled} onClick={()=>run()} variant="subtle" color="green"><IconPlayerPlay size={16} stroke={1.5} /></ActionIcon>
                <ActionIcon onClick={()=>copy()} disabled={disabled} variant="subtle" color="indigo">
                  <IconCopy style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                </ActionIcon>
                <ActionIcon onClick={()=>edit()} disabled={disabled} variant="subtle" color="orange">
                  <IconPencil style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                </ActionIcon>
                <ActionIcon onClick={()=>remove()} disabled={disabled} variant="subtle" color="red">
                  <IconTrash size={16} stroke={1.5} />
                </ActionIcon>
              </Group>
          </Grid.Col>
      </Grid>
  </Paper>
  )
}

export default function Rules() {
  const { name, rules, mutate } = useContext(SchemaContext);
  const [ running, setRunning ] = useState<Rule|undefined>(undefined);
  const [ editing, edit ] = useState<Rule|undefined>(undefined);
  const [creating, { open, close }] = useDisclosure(false);

  const { put: reorder, loaders: l1, setLoaders } = useAPI<Rule[], { from: number, to: number }>({
    url: `/schema/${name}/rule/reorder`,
    check: o => {
      const from = o.data?.from;
      const to = o.data?.to;
      if (from===to||!from||!to) return true;
      const copy = [...rules];
      copy[from] = rules[to];
      copy[to] = rules[from];
      mutate({ rules: copy });
      setLoaders(l=>({...l, [copy[from].name]: true, [copy[to].name]: true }))
    },
    then: (rules,o) => {setLoaders(l=>({...l, [rules[o.data?.from||0].name]: undefined, [rules[o.data?.to||0].name]: undefined })); mutate({ rules }); },
  });

  const { post: copy, loaders: l2 } = useAPI<Rule[]>({
    url: `/schema/${name}/rule/copy`,
    then: rules => { mutate({ rules }); },
  });

  const { del, loaders: l3 } = useAPI<Rule[]>({
    url: `/schema/${name}/rule`,
    check: o => { mutate({ rules: rules.filter(r=>r.name!==o.key) }); },
    then: rules => { mutate({ rules }); },
  });
  
  const { put: toggle, loaders: l4 } = useAPI<Rule[]>({
    url: `/schema/${name}/rule/toggle`,
    check: o => { mutate({ rules: rules.map(r=>r.name===o.key?{...r, enabled: !r.enabled}:r) }); },
    then: rules => { mutate({ rules }); },
  });

  const loaders = { ...l1, ...l2, ...l3, ...l4 };

  const remove = (name: string) =>
  modals.openConfirmModal({
      title: 'Permanently Delete Rule',
      centered: true,
      children: (
      <Text size="sm">
          Are you sure you want to delete {name}? This action is destructive and cannot be reversed.
      </Text>
      ),
      labels: { confirm: 'Delete rule', cancel: "No, don't delete it" },
      confirmProps: { color: 'red' },
      onConfirm: () => del({data: {name}, key: name }),
  });

  const add = () => {
    const initialValues = {
      name: '',
      primary: undefined,
      secondaries: [],
      conditions: [],
      before_actions: [],
      actions: [],
      after_actions: [],
      config: {},
    } as unknown as Rule;
    open();
    edit(initialValues);
  }

  return (
    editing?<Editor editing={editing} creating={creating} close={()=>{edit(undefined);close(); }} />:
    <Container label={<Head rightSection={<Button onClick={()=>add()} leftSection={<IconPlus size={16} />} variant="light">Add</Button>} >Rules</Head>} >
      <RunModal rule={running} close={()=>setRunning(undefined)} />
      {rules.length>0?
      <Box>
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={1}/>
                    <Grid.Col span={3}>Name</Grid.Col>
                    <Grid.Col span={4}>Actions</Grid.Col>
                    <Grid.Col span={3}/>
                </Grid>
            </Paper>
            <DragDropContext
            onDragEnd={({ destination, source }) => reorder({ data: { from: source.index, to: destination?.index || 0 } }) }
            >
            <Droppable droppableId="dnd-list" direction="vertical">
                {provided => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {rules.map((item, index) => {
                        const loading = loaders[item.name] || false;
                        //const error = errors[item.name];
                        return (
                        <Draggable key={item.name} index={index} draggableId={item.name} isDragDisabled={loading} >
                        {provided => (
                            <Item
                            provided={provided}
                            item={item}
                            disabled={loading}
                            loading={loading}
                            //error={error}
                            remove={()=>{remove(item.name)}}
                            copy={()=>{copy({data: {name: item.name}, key: item.name })}}
                            toggle={()=>{toggle({data: {name: item.name}, key: item.name })}}
                            run={()=>setRunning(item)}
                            edit={()=>edit(item)}
                            />
                        )}
                        </Draggable>
                    )})}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
      </Box>:
      <Paper withBorder p="lg" pos="relative" >
          No rules configured.
      </Paper>}
      
    </Container>
  )
}
