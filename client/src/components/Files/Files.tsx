import Container from "../Common/Container";
import Head from "../Common/Head";
import { ActionIcon, Badge, Box, Button, Grid, Group, Loader, LoadingOverlay, Paper, TextInput, Text, Tooltip, Modal, Alert } from '@mantine/core';
import { DragDropContext, Droppable, Draggable, DraggableProvided } from '@hello-pangea/dnd';
import { IconAlertCircle, IconGripVertical, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import useAPI from "../../hooks/useAPI";
import CopyIcon from "../Common/CopyIcon";
import { useContext, useState } from "react";
import SchemaContext from "../../providers/SchemaContext2";
import { extIcons } from "../../modules/common";
import { notifications } from "@mantine/notifications";
import useImporter from "../../hooks/useImporter";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";

function hasHandle(haystack: string = "", needle: string){ return haystack.includes(`$file.${needle}`) || haystack.includes(`$file/${needle}`); }

function findDependencies(schema: Schema, value: string) {
    for (const connector of (schema.connectors||[])) {
        if (connector.id!=="csv") continue;
        if (hasHandle(connector.path as string, value)) return `connector '${connector.name}' (path)`;
    }
    for (const rule of (schema.rules||[])) {
        if (hasHandle(rule.display, value)) return `rule ${rule.name}, display name`;
        for (const condition of (rule.conditions||[])) {
            if (hasHandle(condition.key, value)) return `rule ${rule.name}, condition key`;
            if (hasHandle(condition.value, value)) return `rule ${rule.name}, condition value`;
        }
        const searchActions = (actions: Action[] = []) => {
            for (const action of actions) {
                for (const key of Object.keys(action)) {
                    if (!action[key]) continue;
                    if (typeof action[key] === "string") {
                        if (hasHandle(action[key] as string, value)) return `rule ${rule.name}, action, ${key}`;
                    } else if ( typeof action[key] === "object" && (action[key] as object).constructor.name == "Array") {
                        const array = action[key] as Record<string, unknown>;
                        for (const k of Object.keys(array)) {
                            const v = array[k];
                            if (typeof v === "string" && hasHandle(v as string, value)) return `rule ${rule.name}, action, ${key}, ${k}`;
                            if ( typeof v === "object"){
                                for (const kk of Object.keys(v as object)) {
                                    const vv = (v as {[k: string]: unknown})[kk];
                                    if (typeof vv === "string" && hasHandle(vv as string, value)) return `rule ${rule.name}, action, ${key}, ${k}, ${kk}`;
                                }
                            }
                        }
                    }
                }
            }
        }
        const found = searchActions(rule.before_actions) || searchActions(rule.actions) || searchActions(rule.after_actions);
        if (found) return found;
    }

}

function Edit( { editing, setData }: { editing: Doc, close(): void, setData: (data: React.SetStateAction<Doc[]>) => void} ) {
    const { name } = useContext(SchemaContext);
    const form = useForm({ initialValues: editing });
    const { data: success, put, error, loading } = useAPI<Doc[]>({
        url: `/schema/${name}/storage`,
        data: form.values,
        form,
        then: docs => setData(docs)
    });
    return (
    <Box>
        <TextInput
            label="File Name"
            placeholder="my_file"
            withAsterisk {...form.getInputProps('name')}
        />
        {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
        {success&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} color="lime">Changes saved.</Alert>}
        <Group mt="xs" justify="flex-end" ><Button onClick={()=>put()} variant="light" loading={loading} >Save</Button></Group>
    </Box>)
}

interface ItemProps {
    provided: DraggableProvided;
    item: Doc, disabled?: boolean;
    loading?: boolean;
    error?: string;
    remove(): void;
    update: (id: string, name: string) => void;
    save: (doc: Doc)=> void;
    edit(): void;
}
function Item( { provided, item, disabled, loading, error, remove, edit }: ItemProps ) {
    const Icon = extIcons[item.ext];
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
            <Group gap="xs"><Text c={error?"red":undefined} >{item.name}</Text><CopyIcon disabled={disabled} value={`{{$file.${item.name}}}`} /></Group>
            </Grid.Col>
            <Grid.Col span={4} c={disabled?"dimmed":undefined}>{!item.updatedAt?<Text>generating...</Text>:<Group gap="xs">{item.id}</Group>}</Grid.Col>
            <Grid.Col span={2}>
                <Group gap="xs" justify="flex-end">
                    {error&&<Tooltip withArrow label={error} w={420} multiline position="top-end" color="red" ><IconAlertCircle size={16} color="red" /></Tooltip>}
                    <ActionIcon onClick={()=>edit()} disabled={disabled} variant="subtle" color="orange">
                        <IconPencil size={16} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={()=>remove()} disabled={disabled} variant="subtle" color="red">
                        <IconTrash size={16} stroke={1.5} />
                    </ActionIcon>
                </Group>
            </Grid.Col>
        </Grid>
    </Paper>
    )
}

export default function Files() {
    const { name, initialValues } = useContext(SchemaContext);
    const { Modal: ModalP, open } = useImporter();
    const [ editing, edit ] = useState<Doc|undefined>(undefined);
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
    const remove = (doc: Doc) => {
        const location = findDependencies(initialValues, doc.name);
        location ?
        modals.openConfirmModal({
            title: 'Delete In-Use File',
            centered: true,
            children: (<Box>
            {location&&<Text fw="bold" c="red" size="sm" mb="xs" >Warning: Usage detected in {location}.</Text>}
            <Text size="sm">
                Are you sure you want to delete this file?
            </Text>
            </Box>
            ),
            labels: { confirm: 'Delete file', cancel: "No don't delete it" },
            confirmProps: { color: 'red' },
            onConfirm: () => {
                del({data: { id: doc.id }, key: doc.id});
            },
        }) : del({data: { id: doc.id }, key: doc.id});
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
        <ModalP onDrop={upload} closeup cleanup />
        <Modal opened={!!editing} onClose={()=>edit(undefined)} title="Edit File">
            {editing&&<Edit editing={editing} close={()=>edit(undefined)} setData={setData} />}
        </Modal>
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
                            <Item
                            provided={provided}
                            item={item}
                            disabled={loading}
                            loading={loading}
                            error={error}
                            remove={()=>remove(item)}
                            update={update}
                            save={save}
                            edit={()=>edit(item)} />
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
