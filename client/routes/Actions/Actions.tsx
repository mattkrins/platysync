import { Container, Group, Title, Paper, Grid, Text, Button, Anchor, useMantineTheme, Loader } from "@mantine/core";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useState } from "react";
import Wrapper from "../../components/Wrapper";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { getActions, loadActions, reorder } from "../../providers/schemaSlice";
import Editor from "./Editor";
import { IconCopy, IconGripVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import useAPI from "../../hooks/useAPI";
import MenuTip from "../../components/MenuTip";
import { availableAction, availableActions } from "../../modules/actions";

function Action({ index, action: { name, id }, edit, refresh }: { index: number, action: ActionConfig, edit(): void, refresh(): void }) {
    const theme = useMantineTheme();
    const loaders = useLoader();
    const loading = loaders[`loadingactions_${index}`];
    const { del, loading: deleting, error: dError, reset: dReset } = useAPI({
        url: `/action`, data: { name }, schema: true,
        then: () => refresh()
    });
    const { put: copy, loading: copying, error: cError, reset: cReset } = useAPI({
        url: `/action/${name}/copy`, schema: true,
        then: () => refresh(),
    });
    const { Icon, color } = availableActions.find(a=>a.name===id) as availableAction;
    return (
    <Draggable index={index} draggableId={name}>
    {(provided, snapshot) => (
    <Paper mb="xs" p="xs" withBorder  {...provided.draggableProps} ref={provided.innerRef} >
        <Grid justify="space-between"  align="center" >
            <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                <Group justify="space-between">
                    <IconGripVertical size="1.2rem" />
                    <Group visibleFrom="xl" ><Icon size={20} color={color?theme.colors[color][6]:undefined} /></Group>
                </Group>
            </Grid.Col>
            <Grid.Col span={4}>{name}</Grid.Col>
            <Grid.Col span={4}>{id}</Grid.Col>
            <Grid.Col span={3} miw={120}>
                    <Group gap="xs" justify="flex-end">
                        {loading&&<Loader size="xs" />}
                        <MenuTip label="Copy" Icon={IconCopy} error={cError} reset={cReset} onClick={()=>copy()} loading={copying} color="indigo" variant="subtle" />
                        <MenuTip label="Edit" Icon={IconPencil} onClick={edit} color="orange" variant="subtle" />
                        <MenuTip label="Delete" Icon={IconTrash} error={dError} reset={dReset} onClick={async () => await del()} loading={deleting} color="red" variant="subtle" />
                    </Group>
            </Grid.Col>
        </Grid>
    </Paper>
    )}
    </Draggable>)
}


export default function Actions() {
    const { loadingFiles } = useLoader();
    const dispatch = useDispatch();
    const actions = useSelector(getActions);
    const [ editing, setEditing ] = useState<[ActionConfig,boolean]|undefined>(undefined);
    const close = () => setEditing(undefined);
    const add = () => setEditing([{ name: "", id: "" },false]);
    const refresh = () => dispatch(loadActions());
    return (
    <Container>
        <Editor editing={editing} close={close} refresh={refresh} />
        <Group justify="space-between">
            <Title mb="xs" >Actions</Title>
            <Button onClick={add} loading={loadingFiles} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loadingFiles} >
            {actions.length<=0?<Text c="dimmed" >No actions configured. <Anchor onClick={add} >Add</Anchor> pre-configurations to use specific actions in rules.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={1}/>
                    <Grid.Col span={4}>Name</Grid.Col>
                    <Grid.Col span={4}>Action</Grid.Col>
                    <Grid.Col span={3}/>
                </Grid>
            </Paper>}
            <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "actions", from: source.index, to: destination?.index || 0 })) } >
            <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {actions.map((action, index) => <Action index={index} key={action.name} action={action} edit={()=>setEditing([{...action},true])} refresh={refresh} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Wrapper>
    </Container>
    )
}

