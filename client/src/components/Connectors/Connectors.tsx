import { ActionIcon, Badge, Box, Button, Grid, Group, Loader, Modal, Paper, Tooltip, rem, useMantineTheme, Text, Card, SimpleGrid, UnstyledButton } from '@mantine/core'
import { IconAlertCircle, IconCopy, IconGripVertical, IconPencil, IconPlus, IconTestPipe, IconTrash } from '@tabler/icons-react'
import Head from '../Common/Head'
import Container from '../Common/Container'
import { useContext, useState } from 'react';
import SchemaContext from '../../providers/SchemaContext2';
import { DragDropContext, Droppable, Draggable, DraggableProvided } from '@hello-pangea/dnd';
import useAPI from '../../hooks/useAPI';
import { notifications } from '@mantine/notifications';
import Editor from './Editor';
import classes from './Connectors.module.css'
import providers, { provider } from './providers';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';

function findDependencies(schema: Schema, value: string) {
    for (const rule of (schema.rules||[])) {
        if (rule.primary === value) return `schema ${schema.name}, primary`;
        for (const secondary of (rule.secondaries||[])) {
            if (secondary.primary === value) return `schema ${schema.name}, secondary `;
        }
    }
    for (const connector of (schema.connectors||[])) {
        if (connector.proxy === value) return `connector ${connector.name}, proxy`;
    }
}

function NewModal({ opened, close, edit }: { opened: boolean, close(): void, edit(c?: Connector): void }) {
    const theme = useMantineTheme();
    const add = (provider: provider)=> edit({...provider.initialValues, id: provider.id, name: provider.id });
    return (
    <Modal size="lg" styles={{content:{backgroundColor:'transparent'},body:{padding:0,margin:0} }} opened={opened} onClose={close} withCloseButton={false}>
        <Card mih={300} withBorder radius="md" className={classes.card}>
            <Group justify="space-between">
                <Text className={classes.title}>Select a provider</Text>
            </Group>
            <SimpleGrid cols={2} mt="md">
            {Object.values(providers).map((item) =>
            <UnstyledButton onClick={()=>add(item)} key={item.id} className={classes.item}>
                <item.Icon color={theme.colors[item.color][6]} size="2rem" />
                <Text size="xs" mt={7}>{item.name}</Text>
            </UnstyledButton>
            )}
            </SimpleGrid>
        </Card>
    </Modal>
    )
}

interface ItemProps {
    provided: DraggableProvided;
    item: Connector, disabled?: boolean;
    loading?: boolean;
    error?: string;
    remove: (name: string)=> void;
    test: (name: string)=>()=> void;
    copy: (name: string)=>()=> void;
    edit: React.Dispatch<React.SetStateAction<Connector | undefined>>
}
function Item( { provided, item, disabled, loading, error, remove, test, edit, copy }: ItemProps ) {
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
                    <provider.Icon color={theme.colors[provider.color][6]} size={20} stroke={1.5} />
                </Group>
            </Grid.Col>
            <Grid.Col span={3} c={disabled?"dimmed":error?"red":undefined}>
                {item.name}
            </Grid.Col>
            <Grid.Col span={4} c={disabled?"dimmed":undefined}><Group gap="xs">{provider.name}</Group></Grid.Col>
            <Grid.Col span={3}>
                <Group gap="xs" justify="flex-end">
                    {error&&<Tooltip withArrow label={error} w={420} multiline position="top-end" color="red" ><IconAlertCircle size={16} color="red" /></Tooltip>}
                    <ActionIcon onClick={test(item.name)} disabled={disabled} variant="subtle" color="lime" >
                        <IconTestPipe style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={copy(item.name)} disabled={disabled} variant="subtle" color="indigo">
                        <IconCopy style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={()=>edit(item)} disabled={disabled} variant="subtle" color="orange">
                        <IconPencil style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={()=>remove(item.name)} disabled={disabled} variant="subtle" color="red">
                        <IconTrash size={16} stroke={1.5} />
                    </ActionIcon>
                </Group>
            </Grid.Col>
        </Grid>
    </Paper>
    )
}

export default function Connectors() {
    const { name, connectors, mutate, initialValues } = useContext(SchemaContext);
    const [ editing, edit ] = useState<Connector|undefined>(undefined);
    const [opened, { open, close }] = useDisclosure(false);

    const { put, post, del, loaders, errors, setLoaders } = useAPI<Connector[]>({
        url: `/schema/${name}/connector`,
        default: connectors,
        preserve: true,
        then: connectors => mutate({ connectors }),
        preserveErrors: false,
        noError: true,
        catch: (message) => notifications.show({ title: "Error", message, color: 'red', })
    });

    const reorder = (from: number, to: number) => {
        if (from===to) return;
        const copy = [...connectors];
        copy[from] = connectors[to];
        copy[to] = connectors[from];
        mutate({ connectors: copy });
        setLoaders(l=>({...l, [copy[from].name]: true, [copy[to].name]: true }));
        put({append:'/reorder', data: { from, to } })
        .finally(()=> setLoaders(l=>({...l, [copy[from].name]: undefined, [copy[to].name]: undefined })) );
    }

    const remove = (name: string) => {
        const location = findDependencies(initialValues, name);
        modals.openConfirmModal({
            title: location?'Delete In-Use Connector':'Delete Connector',
            centered: true,
            children: (<Box>
            {location&&<Text fw="bold" c="red" size="sm" mb="xs" >Warning: Usage detected in {location}.</Text>}
            <Text size="sm">
                Are you sure you want to delete this connector? This action is destructive and cannot be reversed.
            </Text>
            </Box>
            ),
            labels: { confirm: 'Delete connector', cancel: "No don't delete it" },
            confirmProps: { color: 'red' },
            onConfirm: () => {
                mutate({ connectors: connectors.filter(c=>c.name!==name) });
                del({ data: { name }, key: name });
            },
        });
    }
    
    const test = (name: string) => () => {
        put({append:'/test', data: { name }, key: name }).then(()=>{
            notifications.show({ title: "Success",message: `${name} connected successfully.`, color: 'lime', });
        });
    }
    
    const copy = (name: string) => () => {
        post({append:'/copy', data: { name }, key: name }).then(()=>{
            notifications.show({ title: "Success",message: `${name} successfully copied.`, color: 'lime', });
        });
    }

    return (
    <Container label={<Head rightSection={<Button onClick={open} leftSection={<IconPlus size={16} />} variant="light">Add</Button>} >Connectors</Head>} >
        <NewModal opened={opened} close={close} edit={edit} />
        <Modal opened={!!editing} onClose={()=>edit(undefined)} title={editing?`${opened?'Adding':'Editing'} ${editing?.id}`:undefined}>
            {editing&&<Editor editing={editing} creating={opened} close={()=>{edit(undefined); close(); }} put={put} />}
        </Modal>
        {connectors.length>0?
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
                    {connectors.map((item, index) => {
                        const loading = loaders[item.name] || false;
                        const error = errors[item.name];
                        return (
                        <Draggable key={item.name} index={index} draggableId={item.name} isDragDisabled={loading} >
                        {provided => (
                            <Item
                            provided={provided}
                            item={item}
                            disabled={loading}
                            loading={loading}
                            error={error}
                            remove={remove}
                            test={test}
                            copy={copy}
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
