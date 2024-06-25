import { Button, Container, Group, Title, Text, Anchor, Grid, Paper } from "@mantine/core";
import Wrapper from "../../components/Wrapper";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { getConnectors, getName, loadConnectors } from "../../providers/schemaSlice";

export default function Connectors() {
    const { loadingConnectors } = useLoader();
    const dispatch = useDispatch();
    const connectors = useSelector(getConnectors);
    const schema_name = useSelector(getName);
    const [ editing, setEditing ] = useState<[Connector,boolean]|undefined>(undefined);
    const close = () => setEditing(undefined);
    const add = () => setEditing([{ name: "", type: 'provider' },false]);
    const refresh = () => dispatch(loadConnectors());
    return (
    <Container>
        <Group justify="space-between">
            <Title mb="xs" >Connector Manager</Title>
            <Button leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loadingConnectors} >
            {connectors.length<=0?<Text c="dimmed" >No connectors in schema. <Anchor onClick={add} >Add</Anchor> a connector to create a rule.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={5}>Name</Grid.Col>
                    <Grid.Col span={5}>Key</Grid.Col>
                    <Grid.Col span={2}/>
                </Grid>
            </Paper>}
        </Wrapper>
    </Container>
    )
}
