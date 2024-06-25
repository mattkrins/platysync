import { Container, Group, Title, Button, Paper, Text, Grid, Anchor, ActionIcon, Tooltip } from "@mantine/core";
import { IconDownload, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import Wrapper from "../../components/Wrapper";
import { useAppDispatch, useAppSelector } from "../../providers/hooks";
import { getFiles, getName, loadFiles } from "../../providers/schemaSlice";
import Editor from "./Editor";
import useAPI from "../../hooks/useAPI";
import { modals } from "@mantine/modals";

const download = (schema_name: string, name: string) => {
    const url = new URL(window.location.href);
    window.open(`/api/v1/schema/${schema_name}/file/${name}`, "_blank");
}

function File({ file: { name, key }, edit, refresh }: { file: psFile, edit(): void, refresh(): void }) {
    const schema_name = useAppSelector(getName);
    const { del, loading: deleting, error } = useAPI<User[]>({
        url: `/api/v1/schema/${schema_name}/file`, data: { name },
        then: () => refresh()
    });
    const clickDel = () =>
    modals.openConfirmModal({
        title: 'Delete File',
        children: <Text size="sm">Are you sure you want to delete <b>{name}</b>?<br/>This action is destructive and cannot be reversed.</Text>,
        labels: { confirm: 'Delete file', cancel: "Cancel" },
        confirmProps: { color: 'red' },
        onConfirm: async () => await del(),
    });
    
    return (
    <Paper mb="xs" p="xs" withBorder >
        <Grid justify="space-between"  align="center" >
            <Grid.Col span={5}>{name}</Grid.Col>
            <Grid.Col span={5}>{key}</Grid.Col>
            <Grid.Col span={2}>
                    <Group gap="xs" justify="flex-end">
                        <ActionIcon onClick={()=>download(schema_name, name)} variant="subtle" color="green">
                            <IconDownload size={16} stroke={1.5} />
                        </ActionIcon>
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
    </Paper>)
}


export default function Files() {
    const dispatch = useAppDispatch();
    const files = useAppSelector(getFiles);
    const schema_name = useAppSelector(getName);
    const [ editing, setEditing ] = useState<[psFile,boolean]|undefined>(undefined);
    const close = () => setEditing(undefined);
    const add = () => setEditing([{ name: "", key: "" },false]);
    const refresh = () => dispatch(loadFiles(schema_name));
    return (
    <Container>
        <Editor editing={editing} close={close} refresh={refresh} />
        <Group justify="space-between">
            <Title mb="xs" >File Manager</Title>
            <Button onClick={add} loading={false} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper>
            {files.length<=0?<Text c="dimmed" >No files in schema. <Anchor onClick={add} >Add</Anchor> static files for use in templating.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={5}>Name</Grid.Col>
                    <Grid.Col span={5}>Key</Grid.Col>
                    <Grid.Col span={2}/>
                </Grid>
            </Paper>}
            {files.map((file) => <File key={file.name} file={file} edit={()=>setEditing([file,true])} refresh={refresh} />)}
        </Wrapper>
    </Container>
    )
}
