import { Container, Group, Title, Button, Paper, Text, Grid, Anchor, ActionIcon, Tooltip, Loader, useMantineTheme, Box } from "@mantine/core";
import { Icon, IconDownload, IconFile, IconFileTypeCsv, IconGripVertical, IconPencil, IconPlus, IconProps, IconTrash } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes, useState } from "react";
import Wrapper from "../../components/Wrapper";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { getFiles, loadFiles, reorder } from "../../providers/schemaSlice";
import Editor from "./Editor";
import useAPI from "../../hooks/useAPI";
import { modals } from "@mantine/modals";
import { download, fileIcons } from "../../modules/common";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import MenuTip from "../../components/MenuTip";

function File({ index, file: { name, key, format }, edit, refresh }: { index: number, file: psFile, edit(): void, refresh(): void }) {
    const theme = useMantineTheme();
    const loaders = useLoader();
    const loading = loaders[`loadingfiles_${index}`];
    const { del, loading: deleting, error: dError, reset: dReset, schema_name } = useAPI({
        url: `/file`, data: { name }, schema: true,
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
    const icon = format ? (fileIcons[format]||fileIcons.txt) : fileIcons.txt;
    return (
    <Draggable index={index} draggableId={name}>
    {(provided, snapshot) => (
    <Paper mb="xs" p="xs" withBorder  {...provided.draggableProps} ref={provided.innerRef} >
        <Grid justify="space-between"  align="center" >
            <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                <Group justify="space-between">
                    <IconGripVertical size="1.2rem" />
                    <Group visibleFrom="xl" ><icon.Icon size={20} color={icon.color?theme.colors[icon.color][6]:undefined} /></Group>
                </Group>
            </Grid.Col>
            <Grid.Col span={4}><Text truncate="end">{name}</Text></Grid.Col>
            <Grid.Col span={4}>{key?<Text truncate="end">{key}</Text>:<Text c="dimmed" truncate="end" >{name}</Text>}</Grid.Col>
            <Grid.Col span={3} miw={120}>
                    <Group gap="xs" justify="flex-end">
                        {loading&&<Loader size="xs" />}
                        <MenuTip label="Download" Icon={IconDownload} onClick={()=>download(`/schema/${schema_name}/file/${name}`)} color="lime" variant="subtle" />
                        <MenuTip label="Edit" Icon={IconPencil} onClick={edit} color="orange" variant="subtle" />
                        <MenuTip label="Delete" Icon={IconTrash} error={dError} reset={dReset} onClick={clickDel} loading={deleting} color="red" variant="subtle" />
                    </Group>
            </Grid.Col>
        </Grid>
    </Paper>
    )}
    </Draggable>)
}

export default function Files() {
    const { loadingFiles } = useLoader();
    const dispatch = useDispatch();
    const files = useSelector(getFiles);
    const [ editing, setEditing ] = useState<[psFile,boolean]|undefined>(undefined);
    const close = () => setEditing(undefined);
    const add = () => setEditing([{ name: "", key: "" },false]);
    const refresh = () => dispatch(loadFiles());
    return (
    <Container>
        <Editor editing={editing} close={close} refresh={refresh} />
        <Group justify="space-between">
            <Title mb="xs" >Files</Title>
            <Button onClick={add} loading={loadingFiles} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loadingFiles} >
            {files.length<=0?<Text c="dimmed" >No files in schema. <Anchor onClick={add} >Add</Anchor> static files for use in templating.</Text>:
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
                    {files.map((file, index) => <File index={index} key={file.name} file={file} edit={()=>setEditing([{...file},true])} refresh={refresh} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Wrapper>
    </Container>
    )
}
