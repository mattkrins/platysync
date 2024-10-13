import { Container, Group, Title, Button, Paper, Text, Grid, Anchor, Loader } from "@mantine/core";
import { IconCopy, IconGripVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import Wrapper from "../../../components/Wrapper";
import { useDispatch, useLoader, useSelector } from "../../../hooks/redux";
import { getsDictionary, loadsDictionary, reorder } from "../../../providers/schemaSlice";
import useAPI from "../../../hooks/useAPI";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import MenuTip from "../../../components/MenuTip";
import useEditor from "../../../hooks/useEditor";
import Editor from "./Editor";

function Entry({ index, entry: { key, value }, edit, refresh }: { index: number, entry: kvPair, edit(): void, refresh(): void }) {
    const loaders = useLoader();
    const loading = loaders[`loadingdictionary_${index}`];
    const { del, loading: deleting, error: dError, reset: dReset, schema_name } = useAPI({
        url: `/dictionary`, data: { key }, schema: true,
        then: () => refresh()
    });
    const { put: copy, loading: copying, error: cError, reset: cReset } = useAPI({
        url: `/dictionary/${key}/copy`, schema: true,
        then: () => refresh(),
    });
    const clickDel = () => del();
    return (
    <Draggable index={index} draggableId={key}>
    {(provided, snapshot) => (
    <Paper mb="xs" p="xs" withBorder  {...provided.draggableProps} ref={provided.innerRef} >
        <Grid justify="space-between"  align="center" >
            <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                <Group justify="space-between">
                    <IconGripVertical size="1.2rem" />
                </Group>
            </Grid.Col>
            <Grid.Col span={4}><Text truncate="end">{key}</Text></Grid.Col>
            <Grid.Col span={4}><Text truncate="end">{value}</Text></Grid.Col>
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

export default function Dictionary() {
  const dispatch = useDispatch();
  const { loadingDictionary } = useLoader();
  const entries = useSelector(getsDictionary);
  const refresh = () => dispatch(loadsDictionary());
  const [ open, editing, { add, close, edit } ] =  useEditor({ key: "", value: "" });
  return (
  <Container>
      <Editor open={open} adding={!editing} close={close} refresh={refresh} />
      <Group justify="space-between">
        <Group><Title mb="xs" >Dictionary</Title><Text c="dimmed" size="xs" >Dictionary entries can be used in string templates.</Text></Group>
        <Button onClick={()=>add()} loading={loadingDictionary} leftSection={<IconPlus size={18} />} >Add</Button>
      </Group>
      <Wrapper loading={loadingDictionary} >
          {entries.length<=0?<Text c="dimmed" >No dictionary entries in schema scope. <Anchor onClick={()=>add()} >Add</Anchor> entry for use in templating.</Text>:
          <Paper mb="xs" p="xs" >
              <Grid justify="space-between">
                  <Grid.Col span={1}/>
                  <Grid.Col span={4}>Key</Grid.Col>
                  <Grid.Col span={4}>Value</Grid.Col>
                  <Grid.Col span={3}/>
              </Grid>
          </Paper>}
          <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "dictionary", from: source.index, to: destination?.index || 0 })) } >
          <Droppable droppableId="dnd-list" direction="vertical">
              {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                  {entries.map((entry, index) => <Entry index={index} key={entry.key} entry={entry} edit={()=>edit(entry)} refresh={refresh} />)}
                  {provided.placeholder}
              </div>
              )}
          </Droppable>
          </DragDropContext>
      </Wrapper>
  </Container>
  )
}
