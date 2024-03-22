import Container from "../Common/Container";
import Head from "../Common/Head";
import { ActionIcon, Badge, Grid, Group, Paper } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { IconFile, IconGripVertical, IconPencil, IconTrash } from '@tabler/icons-react';

const data = [
  { position: 6, mass: 12.011, symbol: 'C', name: 'Carbon' },
  { position: 7, mass: 14.007, symbol: 'N', name: 'Nitrogen' },
  { position: 39, mass: 88.906, symbol: 'Y', name: 'Yttrium' },
  { position: 56, mass: 137.33, symbol: 'Ba', name: 'Barium' },
  { position: 58, mass: 140.12, symbol: 'Ce', name: 'Cerium' },
];


export default function Files() {
    const [state, handlers] = useListState(data);
    return (
    <Container label={<Head >File Manager</Head>} >
        <Paper mb="xs" p="xs" >
            <Grid justify="space-between">
                <Grid.Col span={2}/>
                <Grid.Col span={3}>ID</Grid.Col>
                <Grid.Col span={5}>Name</Grid.Col>
                <Grid.Col span={2}/>
            </Grid>
        </Paper>
        <DragDropContext
        onDragEnd={({ destination, source }) =>
            handlers.reorder({ from: source.index, to: destination?.index || 0 })
        }
        >
        <Droppable droppableId="dnd-list" direction="vertical">
            {provided => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {state.map((item, index) => (
                    <Draggable key={item.symbol} index={index} draggableId={item.symbol}>
                    {provided => (
                        <Paper mb="xs" p="xs" withBorder ref={provided.innerRef} {...provided.draggableProps} >
                            <Grid justify="space-between">
                                <Grid.Col span={2} {...provided.dragHandleProps} >
                                    <Group><IconGripVertical stroke={1.5} /><IconFile stroke={1.5} /><Badge variant="light">ext</Badge></Group>
                                </Grid.Col>
                                <Grid.Col span={3}>ID</Grid.Col>
                                <Grid.Col span={5}>Name</Grid.Col>
                                <Grid.Col span={2}>
                                    <Group gap={0} justify="flex-end">
                                    <ActionIcon variant="subtle" color="gray">
                                        <IconPencil stroke={1.5} />
                                    </ActionIcon>
                                    <ActionIcon variant="subtle" color="red">
                                        <IconTrash stroke={1.5} />
                                    </ActionIcon>
                                    </Group>
                                </Grid.Col>
                            </Grid>
                        </Paper>
                    )}
                    </Draggable>
                ))}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Container>
    )
}
