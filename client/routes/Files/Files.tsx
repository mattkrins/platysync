import { Container, Group, Title, Button, Paper, Text, Grid, Anchor } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import Wrapper from "../../components/Wrapper";
import { useAppSelector } from "../../providers/hooks";
import { getFiles } from "../../providers/schemaSlice";
import Editor from "./Editor";

export default function Files() {
    const files = useAppSelector(getFiles);
    const [ editing, setEditing ] = useState<[psFile,boolean]|undefined>(undefined);
    const close = () => setEditing(undefined);
    const add = () => setEditing([{ name: "", key: "" },false]);
    return (
    <Container>
        <Editor editing={editing} close={close} refresh={()=>{}}  />
        <Group justify="space-between">
            <Title mb="xs" >File Manager</Title>
            <Button onClick={add} loading={false} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper>
            {(files||[]).length<=0?<Text c="dimmed" >No files in schema. <Anchor onClick={add} >Add</Anchor> static files for use in templating.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={10}>Name</Grid.Col>
                    <Grid.Col span={2}/>
                </Grid>
            </Paper>}
        </Wrapper>
    </Container>
    )
}
