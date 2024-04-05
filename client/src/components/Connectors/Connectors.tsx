import { Badge, Box, Button, Grid, Group, Loader, Paper, useMantineTheme } from '@mantine/core'
import { IconGripVertical, IconPlus } from '@tabler/icons-react'
import Head from '../Common/Head'
import Container from '../Common/Container'
import { useContext } from 'react';
import SchemaContext from '../../providers/SchemaContext2';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { providers } from '../../modules/connectors';

function Item( { provided, item, disabled, loading, error, remove, update, save } ) {
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
            <Grid.Col span={3} c={disabled?"dimmed":undefined}>
                {item.name}
            </Grid.Col>
            <Grid.Col span={4} c={disabled?"dimmed":undefined}><Group gap="xs">{provider.name}</Group></Grid.Col>
            <Grid.Col span={3}>
                
            </Grid.Col>
        </Grid>
    </Paper>
    )
}

export default function Connectors() {
    const { name, connnectors, mutate } = useContext(SchemaContext);

    const reorder = (from: number, to: number) => {
        const copy = [...connnectors];
        copy[to] = connnectors[from];
        copy[from] = connnectors[to];
        mutate({ connnectors: copy });
    }


    return (
    <Container label={<Head rightSection={<Button leftSection={<IconPlus size={16} />} variant="light">Add</Button>} >Connectors</Head>} >
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
                        const loading = false;
                        //const loading = loaders[item.id] || false;
                        const error = false;
                        //const error = errors[item.id];
                        return (
                        <Draggable key={item.name} index={index} draggableId={item.name} isDragDisabled={loading} >
                        {provided => (
                            <Item provided={provided} item={item} disabled={loading} loading={loading} error={error} />
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
