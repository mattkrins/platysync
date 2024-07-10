import { Button, Container, Group, Title, Text, Anchor, Grid, Paper, Menu, ActionIcon, Loader, Tooltip, Badge, useMantineTheme, Box } from "@mantine/core";
import Wrapper from "../../components/Wrapper";
import { IconAlertCircle, IconCircleCheckFilled, IconCopy, IconGripVertical, IconPencil, IconPlus, IconTestPipe, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { getConnectors, getName, loadConnectors, reorder } from "../../providers/schemaSlice";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import Editor from "./Editor";
import { providers } from "../../modules/providers";
import { modals } from "@mantine/modals";
import useAPI from "../../hooks/useAPI";
import MenuTip from "../../components/MenuTip";

function Connector({ index, connector: { id, name, ...options }, edit, refresh }: { index: number, connector: Connector, edit(): void, refresh(): void }) {
    const theme = useMantineTheme();
    const loaders = useLoader();
    const loading = loaders[`loadingconnectors_${index}`];
    const { data: valid, post: validate, loading: validating, error: vError, reset: vReset } = useAPI<boolean>({
        url: `/connector/validate`, data: { id, name, ...options }, schema: true,
    });
    const { del, loading: deleting, error: dError, reset: dReset } = useAPI({
        url: `/connector`, data: { name }, schema: true,
        then: () => refresh(),
    });
    const { put: copy, loading: copying, error: cError, reset: cReset } = useAPI({
        url: `/connector/${name}/copy`, schema: true,
        then: () => refresh(),
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
            <Tooltip label="Test successfull" position="right" opened={valid||false} withArrow color="green" zIndex={100} >
            <Grid columns={17} justify="space-between"  align="center" >
                <Grid.Col span={2} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group justify="space-between">
                        <IconGripVertical size="1.2rem" />
                        <Group visibleFrom="sm" ><provider.Icon size={20} color={provider.color?theme.colors[provider.color][6]:undefined} /></Group>
                    </Group>
                </Grid.Col>
                <Grid.Col span={9}>{name}</Grid.Col>
                <Grid.Col span={2}>
                    <Group justify="flex-end" visibleFrom="md"><Badge color={provider.color?theme.colors[provider.color][6]:undefined} variant="light">{provider.id}</Badge></Group>
                </Grid.Col>
                <Grid.Col span={4} miw={160}>
                    <Group gap="xs" justify="flex-end">
                        {loading&&<Loader size="xs" />}
                        <MenuTip label="Test" Icon={IconTestPipe} error={vError} reset={vReset} onClick={()=>validate()} loading={validating} color="lime" variant="subtle" />
                        <MenuTip label="Copy" Icon={IconCopy} error={cError} reset={cReset} onClick={()=>copy()} loading={copying} color="indigo" variant="subtle" />
                        <MenuTip label="Edit" Icon={IconPencil} onClick={edit} color="orange" variant="subtle" />
                        <MenuTip label="Delete" Icon={IconTrash} error={dError} reset={dReset} onClick={clickDel} loading={deleting} color="red" variant="subtle" />
                    </Group>
                </Grid.Col>
            </Grid></Tooltip>
        </Paper>
        )}
        </Draggable>)
}
//REVIEW - potential names:
// connector, provider, integration, adapter, interface
// connectors can be a provider or adapter, provider provide data, adapters do not
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
            <Title mb="xs" >Connectors</Title>
            <Button onClick={add} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loadingConnectors} >
            {connectors.length<=0?<Text c="dimmed" >No connectors configured. <Anchor onClick={add} >Add</Anchor> a connector to create rules.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid columns={17} justify="space-between">
                    <Grid.Col span={2}/>
                    <Grid.Col span={9}>Name</Grid.Col>
                    <Grid.Col span={1}>Provider</Grid.Col>
                    <Grid.Col span={4}/>
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
