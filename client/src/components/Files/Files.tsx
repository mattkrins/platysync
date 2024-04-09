import Container from "../Common/Container";
import Head from "../Common/Head";
import { ActionIcon, Badge, Box, Button, Grid, Group, Loader, LoadingOverlay, Paper, TextInput, Text, Tooltip } from '@mantine/core';
import { DragDropContext, Droppable, Draggable, DraggableProvided } from '@hello-pangea/dnd';
import { IconAlertCircle, IconDeviceFloppy, IconGripVertical, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import useAPI from "../../hooks/useAPI2";
import CopyIcon from "../Common/CopyIcon";
import { useContext } from "react";
import SchemaContext from "../../providers/SchemaContext2";
import { extIcons } from "../../modules/common";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import useImporter from "../../hooks/useImporter";

interface ItemProps {
    provided: DraggableProvided;
    item: Doc, disabled?: boolean;
    loading?: boolean;
    error?: string;
    remove: (id: string)=>()=> void;
    update: (id: string, name: string) => void;
    save: (doc: Doc)=> void;
}
function Item( { provided, item, disabled, loading, error, remove, update, save }: ItemProps ) {
    const Icon = extIcons[item.ext];
    const [editing, { toggle, close }] = useDisclosure(false);
    return (
    <Paper mb="xs" p="xs" withBorder ref={provided.innerRef} {...provided.draggableProps}
    style={{ ...provided.draggableProps.style, cursor: loading ? "not-allowed" : undefined }}
    >
        <Grid justify="space-between">
            <Grid.Col span={2} style={{ cursor: loading ? undefined : 'grab' }} {...provided.dragHandleProps} >
                <Group wrap="nowrap" justify="space-between" >
                    {loading?<Loader size="sm" />:<IconGripVertical stroke={1.5} />}
                    {item.ext&&<Badge color={error?"red":undefined} variant="light">{item.ext}</Badge>}
                    {Icon&&<Icon/>}
                </Group>
            </Grid.Col>
            <Grid.Col span={4} c={disabled?"dimmed":undefined}>
                {!editing?<Group gap="xs"><Text c={error?"red":undefined} >{item.name}</Text><CopyIcon disabled={disabled} value={`{{$file.${item.name}}}`} /></Group>:
                <TextInput style={{height:25}} size="xs"
                value={item.name} error={!!error}
                onChange={(event) => update(item.id, event.currentTarget.value)}
                />}
            </Grid.Col>
            <Grid.Col span={4} c={disabled?"dimmed":undefined}>{!item.updatedAt?<Text>generating...</Text>:<Group gap="xs">{item.id}</Group>}</Grid.Col>
            <Grid.Col span={2}>
                <Group gap="xs" justify="flex-end">
                    {error&&<Tooltip withArrow label={error} w={420} multiline position="top-end" color="red" ><IconAlertCircle size={16} color="red" /></Tooltip>}
                    {editing&&<ActionIcon onClick={()=>{ save(item); close(); }} disabled={disabled} variant="subtle" color="green">
                        <IconDeviceFloppy size={16} stroke={1.5} />
                    </ActionIcon>}
                    <ActionIcon onClick={toggle} disabled={disabled} variant="subtle" color="gray">
                        <IconPencil size={16} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={remove(item.id)} disabled={disabled} variant="subtle" color="red">
                        <IconTrash size={16} stroke={1.5} />
                    </ActionIcon>
                </Group>
            </Grid.Col>
        </Grid>
    </Paper>
    )
}

export default function Files() {
    const { name } = useContext(SchemaContext);
    const { Modal, open } = useImporter();
    const { data, setData, loading, loaders, del, post, put, setLoaders, errors } = useAPI<Doc[]>({
        url: `/schema/${name}/storage`,
        default: [],
        preserve: true,
        preserveErrors: false,
        fetch: true,
        noError: true,
        catch: (message) => notifications.show({ title: "Error", message, color: 'red', })
    });
    const reorderObjects = (from: number, to: number, index: string = "index") => {
        setData((items)=>{
            const copy = [...items];
            const f = copy.find(d=>d[index]===from);
            const t = copy.find(d=>d[index]===to);
            if (!f || !t) return [];
            f[index] = to; t[index] = from;
            return copy;
        });
    }
    const docs = data.sort((a, b) => a.index - b.index);
    const update = (id: string, name: string) => setData(d=>d.map(a=>a.id===id ? {...a, name } : {...a}));
    const save = (doc: Doc) => {
        put({ data: doc, key: doc.id });
    }
    const reorder = (from: number, to: number) => {
        if (from===to) return;
        reorderObjects(from, to);
        setLoaders(l=>({...l, [docs[from].id]: true, [docs[to].id]: true }));
        put({data: {from, to}, append: `/reorder` }).finally(()=> setLoaders(l=>({...l, [docs[from].id]: undefined, [docs[to].id]: undefined })) );
    }
    const remove = (id: string) => () => {
        del({data: { id }, key: id})
    }
    const upload = (file: File|null) => {
        if (!file) return;
        setData(d=>[...d, { id: String(d.length), index: d.length, name: "uploading...", ext: '', updatedAt: '' , loading: true }]);
        const data = new FormData();
        data.append('file', file);
        post({data, key: String(docs.length), headers: { 'Content-Type': 'multipart/form-data' }});
    }

    return (
    <Container label={<Head rightSection={<Button leftSection={<IconPlus size={16} />} loading={loading} onClick={open} variant="light">Add</Button>} >File Manager</Head>} >
        <Modal onDrop={upload} closeup cleanup />
        {docs.length>0?
        <Box>
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={2}/>
                    <Grid.Col span={4}>Name</Grid.Col>
                    <Grid.Col span={4}>ID</Grid.Col>
                    <Grid.Col span={2}/>
                </Grid>
            </Paper>
            <DragDropContext
            onDragEnd={({ destination, source }) => reorder(source.index, destination?.index || 0) }
            >
            <Droppable droppableId="dnd-list" direction="vertical">
                {provided => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {docs.map((item) => {
                        const loading = loaders[item.id] || false;
                        const error = errors[item.id];
                        return (
                        <Draggable key={item.id} index={item.index} draggableId={item.id} isDragDisabled={loading} >
                        {provided => (
                            <Item provided={provided} item={item} disabled={loading} loading={loading} error={error} remove={remove} update={update} save={save} />
                        )}
                        </Draggable>
                    )})}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Box>:
        <Paper withBorder p="lg" pos="relative" >
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 1 }} />
            No files in manager.<br/>Add a file to use its path in a template.
        </Paper>}
    </Container>
    )
}
