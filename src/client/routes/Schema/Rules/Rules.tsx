import { Anchor, Button, Container, Grid, Group, Paper, Text, Title } from "@mantine/core";
import { Route, Switch as WSwitch, useLocation } from "wouter";
import { useDispatch, useLoader, useSelector } from "../../../hooks/redux";
import { getRules, loadRules, reorder } from "../../../providers/schemaSlice";
import Run from "../../../components/Run/Run";
import { useState } from "react";
import Wrapper from "../../../components/Wrapper";
import { IconPlus } from "@tabler/icons-react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";

function Rule() {
    return <></>
}

export default function Rules() {
    const [location, setLocation] = useLocation();
    const { loadingRules } = useLoader();
    const dispatch = useDispatch();
    const rules = useSelector(getRules);
    const refresh = () => dispatch(loadRules());
    const [rule, setRule] = useState<Rule | undefined>(undefined);
    const run = (rule: Rule) => setRule(rule);
    const add = () =>setLocation(`${location}/edit`);
    return (
    <Container size="xl">
        <Run rule={rule} close={()=>setRule(undefined)} />
        <Group justify="space-between">
            <Group><Title mb="xs" >Rules</Title><Text c="dimmed" size="xs" >Configure rules which perform comparisons and execute actions.</Text></Group>
            <Button onClick={add} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loadingRules} >
            {rules.length<=0?<Text c="dimmed" >No rules configured. <Anchor onClick={add} >Add</Anchor> a rule to begin.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid columns={17} justify="space-between">
                    <Grid.Col span={1}/>
                    <Grid.Col span={3}>Name</Grid.Col>
                    <Grid.Col ta="end" span={2}>Connectors</Grid.Col>
                    <Grid.Col span={7}>Actions</Grid.Col>
                    <Grid.Col span={4}/>
                </Grid>
            </Paper>}
            <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "rules", from: source.index, to: destination?.index || 0 })) } >
            <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {
                    //rules.map((rule, index) =><Rule index={index} key={index} rule={rule} refresh={refresh} run={run} />)
                    }
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Wrapper>
    </Container>
    )
}