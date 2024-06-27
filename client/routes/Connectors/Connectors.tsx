import { Button, Container, Group, Title, Text, Anchor, Grid, Paper, Menu, ActionIcon, Loader, Tooltip, Badge, useMantineTheme } from "@mantine/core";
import Wrapper from "../../components/Wrapper";
import { IconGripVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { getConnectors, getName, loadConnectors, reorder } from "../../providers/schemaSlice";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import Editor from "./Editor";
import { providers } from "../../modules/providers";
import { modals } from "@mantine/modals";
import useAPI from "../../hooks/useAPI";

function Connector({ index, connector: { id, name }, edit, refresh }: { index: number, connector: Connector, edit(): void, refresh(): void }) {
    const theme = useMantineTheme();
    const loaders = useLoader();
    const loading = loaders[`loadingconnectors_${index}`];
    const { del, loading: deleting, error } = useAPI({
        url: `/connector`, data: { name }, schema: true,
        then: () => refresh()
    });
    const clickDel = () =>
    modals.openConfirmModal({
        title: 'Delete Connector',
        children: <Text size="sm">Are you sure you want to delete <b>{name}</b>?<br/>This action is destructive and cannot be reversed.</Text>,
        labels: { confirm: 'Delete connector', cancel: "Cancel" },
        confirmProps: { color: 'red' },
        onConfirm: async () => await del(),
    });

    const provider = providers.find(p=>p.id===id);
    if (!provider) return <></>;
    

    return (
        <Draggable index={index} draggableId={name}>
        {(provided, snapshot) => (
        <Paper mb="xs" p="xs" withBorder  {...provided.draggableProps} ref={provided.innerRef} >
            <Grid columns={17} justify="space-between"  align="center" >
                <Grid.Col span={2} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group justify="space-between">
                        <IconGripVertical size="1.2rem" />
                        <provider.Icon size={20} color={provider.color?theme.colors[provider.color][6]:undefined} />
                    </Group>
                </Grid.Col>
                <Grid.Col span={5}>{name}</Grid.Col>
                <Grid.Col span={2}>
                    <Group justify="flex-end"><Badge color={provider.color?theme.colors[provider.color][6]:undefined} variant="light">{provider.id}</Badge></Group>
                </Grid.Col>
                <Grid.Col span={4}><Text size="xs" >{provider.name}</Text></Grid.Col>
                <Grid.Col span={3}>
                        <Group gap="xs" justify="flex-end">
                            {loading&&<Loader size="xs" />}
                            <ActionIcon onClick={edit} variant="subtle" color="orange">
                                <IconPencil size={16} stroke={1.5} />
                            </ActionIcon>
                            <Tooltip label={error} opened={!!error} withArrow position="right" color="red">
                            <ActionIcon onClick={clickDel} loading={deleting} variant="subtle" color="red">
                                <IconTrash size={16} stroke={1.5} />
                            </ActionIcon>
                            </Tooltip>
                        </Group>
                </Grid.Col>
            </Grid>
        </Paper>
        )}
        </Draggable>)
}

export default function Connectors() {
    const { loadingConnectors } = useLoader();
    const dispatch = useDispatch();
    const connectors = useSelector(getConnectors);
    const [ editing, setEditing ] = useState<[Connector,boolean]|undefined>(undefined);
    const close = () => setEditing(undefined);
    const add = () => setEditing([{ id: "", name: "", type: 'provider', headers: [] },false]);
    const refresh = () => dispatch(loadConnectors());
    return (
    <Container>
        <Editor editing={editing} close={close} refresh={refresh} />
        <Group justify="space-between">
            <Title mb="xs" >Connector Manager</Title>
            <Button onClick={add} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loadingConnectors} >
            {connectors.length<=0?<Text c="dimmed" >No connectors in schema. <Anchor onClick={add} >Add</Anchor> a connector to create rules.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid columns={17} justify="space-between">
                    <Grid.Col span={2}/>
                    <Grid.Col span={5}>Name</Grid.Col>
                    <Grid.Col span={2}/>
                    <Grid.Col span={4}>Provider</Grid.Col>
                    <Grid.Col span={3}/>
                </Grid>
            </Paper>}
            <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "connectors", from: source.index, to: destination?.index || 0 })) } >
            <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {connectors.map((connector, index) =>
                    <Connector index={index} key={connector.name} connector={connector} edit={()=>setEditing([{...connector},true])} refresh={refresh} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Wrapper>
    </Container>
    )
}
