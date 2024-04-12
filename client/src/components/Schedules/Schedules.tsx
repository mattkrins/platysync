import { ActionIcon, Anchor, Badge, Box, Button, Divider, Grid, Group, Loader, LoadingOverlay, Modal, Paper, Switch, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { IconAlertCircle, IconCalendar, IconCopy, IconFileSignal, IconGripVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import Head from "../Common/Head";
import Container from "../Common/Container";
import useAPI from "../../hooks/useAPI";
import { useState } from "react";
import Editor from "./Editor";
import { useDisclosure } from "@mantine/hooks";
import { DragDropContext, Draggable, DraggableProvided, Droppable } from "@hello-pangea/dnd";
import cronstrue from 'cronstrue';

function Item( { provided, item, loading, error, toggle, edit, remove, copy }: {
    provided: DraggableProvided;
    item: schedule;
    loading?: boolean;
    error?: string;
    toggle(): void;
    edit(): void;
    remove(): void;
    copy(): void;
} ) {
    const theme = useMantineTheme();
    const display = item.type==="cron" ? cronstrue.toString(item.value, { throwExceptionOnParseError: false }) :
    "Watch";
    const Icon = item.type==="cron" ? <IconCalendar size={22} stroke={1.5} color={theme.colors["lime"][6]} /> : <IconFileSignal size={22} stroke={1.5} color={theme.colors["blue"][6]} />;
    const disabled = loading;
    return (
    <Paper mb="xs" p="xs" withBorder ref={provided.innerRef} {...provided.draggableProps}
    style={{ ...provided.draggableProps.style, cursor: loading ? "not-allowed" : undefined }}
    >
        <Grid columns={15} justify="space-between" gutter="xs" align="center">
            <Grid.Col span={1} style={{ cursor: loading ? undefined : 'grab' }} {...provided.dragHandleProps} >
                <Group wrap="nowrap" justify="space-between" >
                    {loading?<Loader size="sm" />:<IconGripVertical stroke={1.5} />}
                    {Icon}
                </Group>
            </Grid.Col>
            <Grid.Col span={2} c={disabled?"dimmed":undefined}>
                {item.schema}
            </Grid.Col>
            <Grid.Col span={9} c={disabled?"dimmed":undefined}>
                <Group>
                    <Badge variant="light">{display}</Badge>
                    <Divider orientation="vertical" />
                    {item.rules.length>0&&<Text truncate="end">Rules: {item.rules.join(', ')}</Text>}
                </Group>
            </Grid.Col>
            <Grid.Col span={3}>
                <Group gap="xs" justify="flex-end">
                    {(item.error||error)&&<Tooltip withArrow label={item.error||error} w={420} multiline position="top-end" color="red" ><IconAlertCircle size={16} color="red" /></Tooltip>}
                    <Switch onClick={()=>toggle()} disabled={loading} checked={item.enabled} color="teal" />
                    <ActionIcon onClick={()=>copy()} disabled={disabled} variant="subtle" color="indigo">
                        <IconCopy size={16} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={()=>edit()} disabled={disabled} variant="subtle" color="orange">
                        <IconPencil size={16} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={()=>remove()} disabled={disabled} variant="subtle" color="red">
                        <IconTrash size={16} stroke={1.5} />
                    </ActionIcon>
                </Group>
            </Grid.Col>
        </Grid>
    </Paper>)
}

export default function Schedules() {
    const [ editing, edit ] = useState<schedule|undefined>(undefined);
    const [ adding, { open, close } ] = useDisclosure(false);
    const add = ()=> { edit({ schema: '', rules: [], type: 'cron', value: '', } as unknown as schedule); open() };

    const { data: schedules, loading, setData, fetch: refresh, loaders: l1, errors: e1, setLoaders } = useAPI<schedule[]>({
        url: `/schedule`,
        default: [],
        fetch: true,
        preserve: true,
        mutate: (ss: schedule[]) => ss.map(s=>({...s, rules: s.rules? JSON.parse(s.rules as unknown as string): [] })).sort((a, b) => a.index - b.index),
    });

    const { put: toggle, loaders: l2, errors: e2 } = useAPI({
        url: `/schedule/toggle`,
        check: o => { setData(sx=>sx.map(s=>(o.key===s.id?{...s, enabled: !s.enabled }:s))) },
        finally: () => refresh(),
    });

    const { del: remove, loaders: l3, errors: e3 } = useAPI({
        url: `/schedule`,
        check: o => { setData(sx=>sx.filter(s=>o.key!==s.id)) },
        finally: () => refresh(),
    });

    const { post: copy, loaders: l4, errors: e4 } = useAPI({
        url: `/schedule/copy`,
        finally: () => refresh(),
    });

    const { put: reorder, loaders: l5, errors: e5 } = useAPI<schedule, { from: number, to: number }>({
        url: `/schedule/reorder`,
        check: o => {
            if (o.data?.from===o.data?.to) return true;
            setLoaders(items=>{
                items[schedules[o.data?.to as number].id] = true;
                items[schedules[o.data?.from as number].id] = true;
                return items;
            });
            setData(items=>{
                const copy = [...items];
                copy[o.data?.to as number] = {...items[o.data?.from as number], index: o.data?.to as number };
                copy[o.data?.from as number] = {...items[o.data?.to as number], index: o.data?.from as number };
                return copy;
            });
        },
        finally: o => {
            setLoaders(items=>{
                delete items[schedules[o.data?.to as number].id];
                delete items[schedules[o.data?.from as number].id];
                return items;
            }); refresh();
        },
    });

    const loaders = { ...l1, ...l2, ...l3, ...l4, ...l5 };
    const errors = { ...e1, ...e2, ...e3, ...e4, ...e5 };

    return (
    <Container label={<Head rightSection={<Button onClick={add} leftSection={<IconPlus size={16} />} loading={loading} variant="light">Add</Button>} >Schedule Manager</Head>} >
        <Modal opened={!!editing} onClose={()=>{edit(undefined); close();}} title={adding?'Add Schedule':'Edit Schedule'}>
            {editing&&<Editor editing={editing} close={()=>{edit(undefined); close();}} adding={adding} refresh={refresh} />}
        </Modal>
        {schedules.length>0?
        <Box>
            <Paper mb="xs" p="xs" >
                <Grid columns={15} justify="space-between" gutter="xs" >
                    <Grid.Col span={1}/>
                    <Grid.Col span={2}>Schema</Grid.Col>
                    <Grid.Col span={9}>Schedule</Grid.Col>
                    <Grid.Col span={3}/>
                </Grid>
            </Paper>
            <DragDropContext onDragEnd={({ destination, source }) => reorder({data: { from: source.index, to: destination?.index || 0 } }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
                {provided => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {schedules.map((item) => {
                        const loading = loaders[item.id];
                        const error = errors[item.id];
                        return (
                        <Draggable key={item.id} index={item.index} draggableId={item.id} isDragDisabled={loading} >
                        {provided => (
                            <Item
                            provided={provided}
                            item={item}
                            loading={loading}
                            error={error}
                            toggle={()=>toggle({data:{id:item.id}, key: item.id})}
                            remove={()=>remove({data:{id:item.id}, key: item.id})}
                            copy={()=>copy({data:{id:item.id}, key: item.id})}
                            edit={()=>edit(item)}
                            />
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
            No Schedules in effect.<br/><Anchor onClick={add} >Add</Anchor> a schedule to automate rule processing.
        </Paper>}
    </Container>
    )
}
