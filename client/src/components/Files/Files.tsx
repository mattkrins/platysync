import Container from "../Common/Container";
import Head from "../Common/Head";
import { ActionIcon, Badge, Box, Button, FileButton, Grid, Group, Loader, LoadingOverlay, Paper, TextInput, Text } from '@mantine/core';
import { DragDropContext, Droppable, Draggable, DraggableProvided } from '@hello-pangea/dnd';
import { IconDeviceFloppy, IconGripVertical, IconPencil, IconTrash } from '@tabler/icons-react';
import useAPI, { Exports } from "../../hooks/useAPI";
import CopyIcon from "../Common/CopyIcon";
import { useContext } from "react";
import SchemaContext from "../../providers/SchemaContext";
import { extIcons } from "../../modules/common";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

interface Doc {
    id: string;
    index: number;
    name: string;
    ext: string;
    updatedAt: string;
    loading?: true
    error?: true
}
interface api extends Exports {
    data: Doc[];
    setData: (data: (docs: Doc[])=>void) => void;
    request: Exports['request'] & {
        loading?: string[]
    }
}

interface ItemProps {
    provided: DraggableProvided;
    item: Doc, disabled?: boolean;
    loading?: boolean;
    remove: (id: string)=>()=> void;
    update: (id: string, name: string) => void;
    save: (doc: Doc)=> void;
}
function Item( { provided, item, disabled, loading, remove, update, save }: ItemProps ) {
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
                    {item.ext&&<Badge variant="light">{item.ext}</Badge>}
                    {Icon&&<Icon/>}
                </Group>
            </Grid.Col>
            <Grid.Col span={4} c={disabled?"dimmed":undefined}>
                {!editing?<Group gap="xs"><Text c={item.error&&"red"} >{item.name}</Text><CopyIcon disabled={disabled} value={`{{$file.${item.name}}}`} /></Group>:
                <TextInput style={{height:25}} size="xs"
                value={item.name} error={item.error}
                onChange={(event) => update(item.id, event.currentTarget.value)}
                />}
            </Grid.Col>
            <Grid.Col span={4} c={disabled?"dimmed":undefined}>{!item.updatedAt?<Text>generating...</Text>:<Group gap="xs">{item.id}</Group>}</Grid.Col>
            <Grid.Col span={2}>
                <Group gap="xs" justify="flex-end">
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
    const { schema } = useContext(SchemaContext);
    const { data, setData, loading, helpers: { reorderObjects } }: api = useAPI({
        url: `/schema/${schema?.name}/storage`,
        default: [],
        preserve: true,
        fetch: true
    });
    const docs = data.sort((a, b) => a.index - b.index);
    const removeLoaders = () =>  setData(d=>d.map(a=>({...a, loading: undefined})));
    const { put: changeName }: api = useAPI({ url: `/schema/${schema?.name}/storage`, cleanup: true, then: d=>setData(d), finally: removeLoaders,
    catch: ({ validation: { id }, error }) =>{
        if (!id) return;
        notifications.show({ title: "Error",message: error||"Unknown error", color: 'red', });
        setData(d=>d.map(a=>a.id===id ? {...a, error: true} : {...a}));
    } });
    const update = (id: string, name: string) => setData(d=>d.map(a=>a.id===id ? {...a, name } : {...a}));
    const save = (doc: Doc) => {
        setData(d=>d.map(a=>a.id===doc.id ? {...doc, loading: true} : {...a}));
        changeName({ data: doc });
    }
    const { put: reorderServer }: api = useAPI({ url: `/schema/${schema?.name}/storage/reorder`, cleanup: true, then: d=>setData(d), finally: removeLoaders });
    const reorder = (from: number, to: number) => {
        if (from===to) return;
        reorderServer({data: {from, to}});
        setData(d=>d.map(a=>[from, to].includes(a.index) ? {...a, loading: true} : {...a}));
        reorderObjects(from, to);
    }
    const { del }: api = useAPI({ url: `/schema/${schema?.name}/storage`, cleanup: true, then: d=>setData(d), finally: removeLoaders });
    const remove = (id: string) => () => {
        setData(d=>d.map(a=>a.id===id ? {...a, loading: true} : {...a}));
        del({data: { id }});
    }
    const { post, loading: uploading } = useAPI({
        url: `/schema/${schema?.name}/storage`, cleanup: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        then: d=>setData(d), finally: () => setData(d=>d.filter(a=>a.updatedAt))
    });
    const upload = (file: File|null) => {
        if (!file) return;
        setData(d=>[...d, { id: String(d.length), index: d.length, name: "uploading...", loading: true }]);
        const formData = new FormData();
        formData.append('file', file);
        post({data: formData});
    }


    return (
    <Container label={<Head rightSection={<FileButton onChange={upload}>{(props) => <Button loading={uploading} variant="light" {...props}>Add</Button>}</FileButton>} >File Manager</Head>} >
        {docs.length>0?<Box>
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
                        const disabled = item.loading || false;
                        return (
                        <Draggable key={item.id} index={item.index} draggableId={item.id} isDragDisabled={item.loading} >
                        {provided => (
                            <Item provided={provided} item={item} disabled={disabled} loading={item.loading} remove={remove} update={update} save={save} />
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
