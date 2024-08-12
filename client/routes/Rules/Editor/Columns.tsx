import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Box, Button, Grid, Group, Text, TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconChevronUp, IconCopy, IconGripVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import useTemplater, { templateProps } from '../../../hooks/useTemplater';
import MenuTip from "../../../components/MenuTip";
import { useRule } from "./Editor";

function Template({ index, column, form, templateProps, path }: { index: number, column: resultColumn, form: UseFormReturnType<Rule>, templateProps: templateProps, path: string } ) {
    const copy = () => form.insertListItem(path, structuredClone(column));
    const remove = () => form.removeListItem(path, index);
    return (
    <Draggable index={index} draggableId={String(index)}>
        {provided => (
            <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps} ref={provided.innerRef}  columns={25} >
                <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span="auto" >
                    <TextInput {...form.getInputProps(`${path}.${index}.name`)}
                    leftSection={<IconChevronUp size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="id, key, name, etc."
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <TextInput {...templateProps(form, `${path}.${index}.value`)}
                    leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="{{connector.header}}"
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

function IDHeader({ form, templateProps }: { form: UseFormReturnType<Rule>, templateProps: templateProps }) {
    const { id } = useRule(form);
    return (
    <Grid align="center" mt="xs" gutter="xs" columns={25} >
        <Grid.Col span={1}/>
        <Grid.Col span="auto" >
            <TextInput label="Name" description="Header name, also used in csv export."
            leftSection={<IconChevronUp size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="ID" {...form.getInputProps('IDName')}
            />
        </Grid.Col>
        <Grid.Col span="auto" >
            <TextInput label="Value" description="Value used for the row, entry, user, etc."
            leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder={id} value={id} disabled
            />
        </Grid.Col>
        <Grid.Col span={2}/>
    </Grid>
    )
}

function RequiredHeaders({ form, templateProps }: { form: UseFormReturnType<Rule>, templateProps: templateProps }) {
    const { displayExample } = useRule(form);
    return (<>
    <Grid align="center" mt="xs" gutter="xs" columns={25} >
        <Grid.Col span={1}/>
        <Grid.Col span="auto" >
            <TextInput label="Name" description="Header name, also used in csv export."
            leftSection={<IconChevronUp size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="ID" {...form.getInputProps('idName')}
            />
        </Grid.Col>
        <Grid.Col span="auto" >
            <TextInput label="Value" description="Value used for the row, entry, user, etc."
            leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            value={displayExample} disabled
            />
        </Grid.Col>
        <Grid.Col span={2}/>
    </Grid>
    <Grid align="center" mt="xs" gutter="xs" columns={25} >
        <Grid.Col span={1}/>
        <Grid.Col span="auto" >
            <TextInput
            leftSection={<IconChevronUp size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="Display" {...form.getInputProps('displayKey')}
            />
        </Grid.Col>
        <Grid.Col span="auto" >
            <TextInput
            leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder={displayExample} {...templateProps(form, 'display', { disabled: !form.values.primary } )}
            />
        </Grid.Col>
        <Grid.Col span={2}/>
    </Grid>
    </>)
}

export default function Headers( { form }: { form: UseFormReturnType<Rule> } ) {
    const templatePath = `columns`;
    const columns = form.getInputProps(templatePath).value as resultColumn[];
    const add = () => form.insertListItem(templatePath, { name: undefined, value: undefined, });
    const { templateSources, inline } = useRule(form, 'iterativeActions');
    const { templateProps, explorer } = useTemplater({names:templateSources, inline});
    return (
    <Box> {explorer}
        <Grid justify="space-between" gutter={0} align="center" >
            <Grid.Col span="content" >
                <Text c="dimmed" size="xs" >Columns can be added to the results view for rows, entries, users, etc.</Text>
            </Grid.Col>
            <Grid.Col span="content">
                <Button size="sm" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} onClick={add}>Add Header</Button>
            </Grid.Col>
        </Grid>
        <RequiredHeaders form={form} templateProps={templateProps} />
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {columns.map((column, index) => <Template key={index} index={index} column={column} form={form} templateProps={templateProps} path={templatePath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Box>
    )
}
