import { Anchor, Button, Container, Grid, Group, Paper, Title, Text } from "@mantine/core";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import Wrapper from "../../components/Wrapper";
import { getRules, reorder } from "../../providers/schemaSlice";
import Editor from "./Editor/Editor";
import { Route, Switch, useLocation } from "wouter";

function RulesList({ add }: { add(): void }) {
    const { loadingRules } = useLoader();
    const dispatch = useDispatch();
    const rules = useSelector(getRules);
    return (
    <Container size="lg">
        <Group justify="space-between">
            <Title mb="xs" >Rules</Title>
            <Button onClick={add} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loadingRules} >
            {rules.length<=0?<Text c="dimmed" >No rules configured. <Anchor onClick={add} >Add</Anchor> a rule to begin.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid columns={17} justify="space-between">
                    <Grid.Col span={2}/>
                    <Grid.Col span={5}>Name</Grid.Col>
                    <Grid.Col span={2}/>
                    <Grid.Col span={4}>Provider</Grid.Col>
                    <Grid.Col span={4}/>
                </Grid>
            </Paper>}
            <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "rules", from: source.index, to: destination?.index || 0 })) } >
            <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {rules.map((rule, index) =><>{JSON.stringify(rule)}</>)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Wrapper>
    </Container>
    )
}

export default function Rules() {
    const [_, setLocation] = useLocation();
    const [ editing, setEditing ] = useState<[Rule,boolean]|undefined>(undefined);
    const close = () => setEditing(undefined);
    const add = () => {
        setEditing([{ name: "", enabled: false, log: false, sources: [], contexts: [], conditions: [], initActions: [], iterativeActions: [], finalActions: [] },false]);
        setLocation("/edit");
    }
    return (
    <Switch>
        <Route path={"/edit"}>{editing&&<Editor editing={editing} close={close} />}</Route>
        <Route path="*"><RulesList add={add} /></Route>
    </Switch>
    )
}