import { ActionIcon, Badge, Box, Button, Grid, Group, Loader, Modal, Paper, Tooltip, rem, useMantineTheme } from '@mantine/core'
import { IconAlertCircle, IconGripVertical, IconPencil, IconPlus, IconTestPipe, IconTrash } from '@tabler/icons-react'
import Head from '../Common/Head'
import Container from '../Common/Container'
import { useContext, useState } from 'react';
import SchemaContext from '../../providers/SchemaContext2';
import { DragDropContext, Droppable, Draggable, DraggableProvided } from '@hello-pangea/dnd';
import { providers } from '../../modules/connectors';
import useAPI from '../../hooks/useAPI2';
import { notifications } from '@mantine/notifications';
import Editor from './Editor';

interface ItemProps {
    provided: DraggableProvided;
    index: number;
    item: Connector, disabled?: boolean;
    loading?: boolean;
    error?: string;
    remove: (name: string, index: number)=>()=> void;
    test: (name: string, index: number)=>()=> void;
    edit: React.Dispatch<React.SetStateAction<Connector | undefined>>
}
function Item( { provided, item, index, disabled, loading, error, remove, test, edit }: ItemProps ) {
    const theme = useMantineTheme();
    const provider = providers[item.id];
    return (
    <Paper mb="xs" p="xs" withBorder ref={provided.innerRef} {...provided.draggableProps}
    style={{ ...provided.draggableProps.style, cursor: loading ? "not-allowed" : undefined }}
    >
        <Grid justify="space-between">
            <Grid.Col span={2} style={{ cursor: loading ? undefined : 'grab' }} {...provided.dragHandleProps} >
                <Group wrap="nowrap" justify="space-between" >
                    {loading?<Loader size="sm" />:<IconGripVertical stroke={1.5} />}
                    <Badge color={theme.colors[provider.color][6]} variant="light">{provider.id}</Badge>
                    <provider.icon color={theme.colors[provider.color][6]} size={20} stroke={1.5} />
                </Group>
            </Grid.Col>
            <Grid.Col span={3} c={disabled?"dimmed":error?"red":undefined}>
                {item.name}
            </Grid.Col>
            <Grid.Col span={4} c={disabled?"dimmed":undefined}><Group gap="xs">{provider.name}</Group></Grid.Col>
            <Grid.Col span={3}>
                <Group gap="xs" justify="flex-end">
                    {error&&<Tooltip withArrow label={error} w={420} multiline position="top-end" color="red" ><IconAlertCircle size={16} color="red" /></Tooltip>}
                    <ActionIcon onClick={()=>edit(item)} variant="subtle" color="orange">
                        <IconPencil style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={test(item.name, index)} disabled={disabled} variant="subtle" color="lime" >
                        <IconTestPipe style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={remove(item.name, index)} disabled={disabled} variant="subtle" color="red">
                        <IconTrash size={16} stroke={1.5} />
                    </ActionIcon>
                </Group>
            </Grid.Col>
        </Grid>
    </Paper>
    )
}

export default function Connectors() {
    const { name, connnectors, mutate } = useContext(SchemaContext);
    const [ editing, edit ] = useState<Connector|undefined>(undefined);

    const { put, del, loaders, errors, setLoaders } = useAPI<Connector[]>({
        url: `/schema/${name}/connector`,
        default: connnectors,
        preserve: true,
        then: connnectors => mutate({ connnectors }),
        preserveErrors: false,
        noError: true,
        catch: (message) => notifications.show({ title: "Error", message, color: 'red', })
    });

    const reorder = (from: number, to: number) => {
        if (from===to) return;
        const copy = [...connnectors];
        copy[to] = connnectors[from];
        copy[from] = connnectors[to];
        mutate({ connnectors: copy });
        setLoaders(l=>({...l, [from]: true, [to]: true }));
        put({append:'/reorder', data: { from, to } }).finally(()=> setLoaders(l=>({...l, [from]: undefined, [to]: undefined })) );
    }

    const remove = (name: string, key: number) => () => {
        mutate({ connnectors: connnectors.filter(c=>c.name!==name) });
        del({ data: { name }, key });
    }
    const test = (name: string, key: number) => () => {
        put({append:'/test', data: { name }, key }).then(()=>{
            notifications.show({ title: "Success",message: `${name} connected successfully.`, color: 'lime', });
        });
    }

    return (
    <Container label={<Head rightSection={<Button leftSection={<IconPlus size={16} />} variant="light">Add</Button>} >Connectors</Head>} >
        <Modal opened={!!editing} onClose={()=>edit(undefined)} title={`Editing ${editing?.name}`}>
            {editing&&<Editor editing={editing} setEditing={edit} />}
        </Modal>
        {connnectors.length>0?
        <Box>
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={2}/>
                    <Grid.Col span={3}>Name</Grid.Col>
                    <Grid.Col span={4}>Provider</Grid.Col>
                    <Grid.Col span={3}/>
                </Grid>
            </Paper>
            <DragDropContext
            onDragEnd={({ destination, source }) => reorder(source.index, destination?.index || 0) }
            >
            <Droppable droppableId="dnd-list" direction="vertical">
                {provided => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {connnectors.map((item, index) => {
                        const loading = loaders[index] || false;
                        const error = errors[index];
                        return (
                        <Draggable key={item.name} index={index} draggableId={item.name} isDragDisabled={loading} >
                        {provided => (
                            <Item
                            provided={provided}
                            index={index}
                            item={item}
                            disabled={loading}
                            loading={loading}
                            error={error}
                            remove={remove}
                            test={test}
                            edit={edit}
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
            No connectors configured.<br/>A connector is required to create a rule.
        </Paper>}
    </Container>
    )
}
