import { Group, Title, Button, Anchor, Paper, Grid, Container, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useState } from "react";
import Wrapper from "../../components/Wrapper";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { getSchedules, loadSchedules, reorder } from "../../providers/schemaSlice";
import Editor from "./Editor";
import useEditor from "../../hooks/useEditor";

export default function Schedules() {
    const { loadingSchedules } = useLoader();
    const dispatch = useDispatch();
    const schedules = useSelector(getSchedules);
    const [ schedule, editing, { add, close } ] =  useEditor<Schedule>({ name: "", enabled: false, triggers: [], tasks: [] });
    const refresh = () => dispatch(loadSchedules());
    return (
    <Container>
        <Editor open={schedule} adding={!editing} close={close} refresh={refresh} />
        <Group justify="space-between">
            <Title mb="xs" >Schedules</Title>
            <Button onClick={()=>add()} loading={loadingSchedules} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loadingSchedules} >
            {schedules.length<=0?<Text c="dimmed" >No schedules in schema. <Anchor onClick={()=>add()} >Add</Anchor> schedules to automate rules.</Text>:
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
