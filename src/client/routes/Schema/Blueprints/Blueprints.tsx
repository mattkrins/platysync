import { Container, Group, Title, Paper, Text, Grid, Loader, useMantineTheme } from "@mantine/core";
import { IconCopy, IconGripVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import Wrapper from "../../../components/Wrapper";
import { useDispatch, useLoader, useSelector } from "../../../hooks/redux";
import { getBlueprints, loadsBlueprints, reorder } from "../../../providers/schemaSlice";
import useAPI from "../../../hooks/useAPI";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import MenuTip from "../../../components/MenuTip";
import useEditor from "../../../hooks/useEditor";
import Editor from "./Editor";
import ActionButton from "../../../components/ActionButton";
import { availableOperations, operation } from "../Rules/Editor/operations";

function Entry({ index, entry: { name, id, ...configs }, edit, refresh }: { index: number, entry: Action, edit(): void, refresh(): void }) {
    const theme = useMantineTheme();
    const loaders = useLoader();
    const loading = loaders[`loadingblueprints_${index}`];
    const { del, loading: deleting, error: dError, reset: dReset } = useAPI({
        url: `/blueprint`, data: { name }, schema: true,
        then: () => refresh(),
    });
    const { put: copy, loading: copying, error: cError, reset: cReset } = useAPI({
        url: `/blueprint/${name}/copy`, schema: true,
        then: () => refresh(),
    });
    const count = Object.values(configs).filter(v=>v).length;
    const clickDel = () => del(); //TODO - dependancy finder
    const operation = availableOperations.find(a=>a.name===id);
    if (!operation) return <MenuTip label="Delete" Icon={IconTrash} error={dError} reset={dReset} onClick={clickDel} loading={deleting} color="red" variant="subtle" />
    return (
    <Draggable index={index} draggableId={name||id}>
    {(provided, _snapshot) => (
    <Paper mb="xs" p="xs" withBorder  {...provided.draggableProps} ref={provided.innerRef} >
        <Grid justify="space-between"  align="center" >
            <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                <Group justify="space-between">
                    <IconGripVertical size="1.2rem" />
                    <Group visibleFrom="xl" ><operation.Icon size={20} color={operation.color?theme.colors[operation.color][6]:undefined} /></Group>
                </Group>
            </Grid.Col>
            <Grid.Col span={4}><Text truncate="end">{name}</Text></Grid.Col>
            <Grid.Col span={3}>{operation.label}</Grid.Col>
            <Grid.Col span={1}><Text truncate="end">{count}</Text></Grid.Col>
            <Grid.Col span={3} miw={120}>
                    <Group gap="xs" justify="flex-end">
                        {loading&&<Loader size="xs" />}
                        <MenuTip label="Edit" Icon={IconPencil} onClick={edit} color="orange" variant="subtle" />
                        <MenuTip label="Copy" Icon={IconCopy} error={cError} reset={cReset} onClick={()=>copy()} loading={copying} color="indigo" variant="subtle" />
                        <MenuTip label="Delete" Icon={IconTrash} error={dError} reset={dReset} onClick={clickDel} loading={deleting} color="red" variant="subtle" />
                    </Group>
            </Grid.Col>
        </Grid>
    </Paper>
    )}
    </Draggable>)
}

export default function Blueprints() {
  const dispatch = useDispatch();
  const { loadingBlueprints } = useLoader();
  const entries = useSelector(getBlueprints);
  const refresh = () => dispatch(loadsBlueprints());
  const [ open, editing, { add, close, edit } ] =  useEditor<Action>({ id: "" });
  const addx = (c: operation) => add({ id: c.name, ...c.initialValues });
  
  return (
  <Container>
      <Editor open={open} adding={!editing} close={close} refresh={refresh} />
      <Group justify="space-between">
        <Group><Title mb="xs" >Blueprints</Title><Text c="dimmed" size="xs" >Blueprints are pre-configured actions for use in rules to reduce duplication and redundancy.</Text></Group>
        <ActionButton add={addx} loading={loadingBlueprints} leftSection={<IconPlus size={18} />} label="Add" />
      </Group>
      <Wrapper loading={loadingBlueprints} >
          {entries.length<=0?<Text c="dimmed" >No blueprints configured. Add an entry to pre-configure an action.</Text>:
          <Paper mb="xs" p="xs" >
              <Grid justify="space-between">
                  <Grid.Col span={1}/>
                  <Grid.Col span={4}>Name</Grid.Col>
                  <Grid.Col span={3}>Action</Grid.Col>
                  <Grid.Col span={1}>Configs</Grid.Col>
                  <Grid.Col span={3}/>
              </Grid>
          </Paper>}
          <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "dictionary", from: source.index, to: destination?.index || 0 })) } >
          <Droppable droppableId="dnd-list" direction="vertical">
              {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                  {entries.map((entry, index) => <Entry index={index} key={entry.name} entry={entry} edit={()=>edit(entry)} refresh={refresh} />)}
                  {provided.placeholder}
              </div>
              )}
          </Droppable>
          </DragDropContext>
      </Wrapper>
  </Container>
  )
}
