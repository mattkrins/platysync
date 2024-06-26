import { Button, Container, Group, Title, Text, Anchor, Grid, Paper, Menu } from "@mantine/core";
import Wrapper from "../../components/Wrapper";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { getConnectors, getName, loadConnectors, reorder } from "../../providers/schemaSlice";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import Editor from "./Editor";

function Connector({ index, file: { name, key }, edit, refresh }: { index: number, file: psFile, edit(): void, refresh(): void }) {
    return (
        <Draggable index={index} draggableId={name}>
        {(provided, snapshot) => (
        <Paper mb="xs" p="xs" withBorder  {...provided.draggableProps} ref={provided.innerRef} >

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
                <Grid justify="space-between">
                    <Grid.Col span={5}>Name</Grid.Col>
                    <Grid.Col span={5}>Key</Grid.Col>
                    <Grid.Col span={2}/>
                </Grid>
            </Paper>}
            <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "connectors", from: source.index, to: destination?.index || 0 })) } >
            <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {connectors.map((file, index) => <Connector index={index} key={file.name} file={file} edit={()=>setEditing([{...file},true])} refresh={refresh} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Wrapper>
    </Container>
    )
}
