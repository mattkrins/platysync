import { Box, Button, Grid, Group, Text, TextInput } from "@mantine/core";
import { IconChevronUp, IconCopy, IconGripVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { editorTab } from "./Editor";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { UseFormReturnType } from "@mantine/form";
import useRule from "../../../../hooks/useRule";
import MenuTip from "../../../../components/MenuTip";
import ExtTextInput from "../../../../components/ExtTextInput";

function RequiredHeaders({ form }: { form: UseFormReturnType<Rule> }) {
    const { displayExample } = useRule(form.values);
    return (<>
    <Grid align="center" mt="xs" gutter="xs" columns={25} >
        <Grid.Col span={1}/>
        <Grid.Col span="auto" >
            <TextInput label="Name" description="Header name, also used in csv export."
            leftSection={<IconChevronUp size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="ID" {...form.getInputProps('idName')}
            />
        </Grid.Col>
        <Grid.Col span="auto" >
            <TextInput label="Value" description="Value used for the row, entry, user, etc."
            leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            value={displayExample} disabled
            />
        </Grid.Col>
        <Grid.Col span={2}/>
    </Grid>
    <Grid align="center" mt="xs" gutter="xs" columns={25} >
        <Grid.Col span={1}/>
        <Grid.Col span="auto" >
            <TextInput
            leftSection={<IconChevronUp size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="Display" {...form.getInputProps('displayKey')}
            />
        </Grid.Col>
        <Grid.Col span="auto" >
            <ExtTextInput
                rule={form.values} scope="iterativeActions"
                leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder={displayExample}
                {...form.getInputProps(`display`)}
            />
        </Grid.Col>
        <Grid.Col span={2}/>
    </Grid>
    </>)
}

function Template({ index, column, form }: { index: number, column: resultColumn, form: UseFormReturnType<Rule> } ) {
    const copy = () => form.insertListItem(`columns`, structuredClone(column));
    const remove = () => form.removeListItem(`columns`, index);
    return (
    <Draggable index={index} draggableId={String(index)}>
        {provided => (
            <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps} ref={provided.innerRef}  columns={25} >
                <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span="auto" >
                    <TextInput {...form.getInputProps(`columns.${index}.name`)}
                    leftSection={<IconChevronUp size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                    placeholder="id, key, name, etc."
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <ExtTextInput
                        rule={form.values} scope="iterativeActions"
                        leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                        placeholder="{{connector.header}}"
                        {...form.getInputProps(`columns.${index}.value`)}
                    />
                </Grid.Col>
                <Grid.Col span={2}>
                    <Group justify="right" gap="xs">
                        <MenuTip label="Copy" Icon={IconCopy} onClick={copy} variant="default" />
                        <MenuTip label="Delete" Icon={IconTrash} onClick={remove} variant="default" />
                    </Group>
                </Grid.Col>
            </Grid>
        )}
    </Draggable>)
}

export default function ({ form }: editorTab) {
    const columns = form.values.columns;
    const add = () => form.insertListItem(`columns`, { name: undefined, value: undefined, });
    return (
        <Box>
            <Grid justify="space-between" gutter={0} align="center" >
                <Grid.Col span="content" >
                    <Text c="dimmed" size="xs" >Columns can be added to the results view for rows, entries, users, etc.</Text>
                </Grid.Col>
                <Grid.Col span="content">
                    <Button size="sm" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} onClick={add}>Add Header</Button>
                </Grid.Col>
            </Grid>
            <RequiredHeaders form={form} />
            <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(`columns`, { from: source.index, to: destination? destination.index : 0 }) } >
                <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {columns.map((column, index) => <Template key={index} index={index} column={column} form={form} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Box>
        )
}
