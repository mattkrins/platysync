import { Group, Title, Button, Anchor, Paper, Grid, Container, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useState } from "react";
import Wrapper from "../../components/Wrapper";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { getSchedules, loadSchedules, reorder } from "../../providers/schemaSlice";

export default function Schedules() {
    const { loadingSchedules } = useLoader();
    const dispatch = useDispatch();
    const schedules = useSelector(getSchedules);
    const [ editing, setEditing ] = useState<[Schedule,boolean]|undefined>(undefined);
    const close = () => setEditing(undefined);
    const add = () => setEditing([{ name: "", enabled: false, triggers: [], actions: [] },false]);
    const refresh = () => dispatch(loadSchedules());
    return (
    <Container>
        <Group justify="space-between">
            <Title mb="xs" >Files</Title>
            <Button onClick={add} loading={loadingSchedules} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loadingSchedules} >
            {schedules.length<=0?<Text c="dimmed" >No files in schema. <Anchor onClick={add} >Add</Anchor> static files for use in templating.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={1}/>
                    <Grid.Col span={4}>Name</Grid.Col>
                    <Grid.Col span={4}>Template Key</Grid.Col>
                    <Grid.Col span={3}/>
                </Grid>
            </Paper>}
            <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "files", from: source.index, to: destination?.index || 0 })) } >
            <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Wrapper>
    </Container>
    )
}
