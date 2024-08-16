import { ActionIcon, Autocomplete, Button, Center, Grid, Group, Select, TextInput } from '@mantine/core'
import { IconCopy, IconEye, IconEyeOff, IconGripVertical, IconPencil, IconPlus, IconTag, IconTrash, IconUser } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { UseFormReturnType } from '@mantine/form';
import MenuTip from '../../../../components/MenuTip';
import Concealer from '../../../../components/Concealer';
import { ldapAttributes } from '../../../../modules/ldap';
import { useDisclosure } from '@mantine/hooks';

function Attribute({ index, entry, form, templateProps, path }:
    { index: number, entry: { method: string, name: string, value: string }, form: UseFormReturnType<Rule>, templateProps: actionProps['templateProps'], path: string }
) {
    const copy = () => form.insertListItem(path, structuredClone(entry));
    const remove = () => form.removeListItem(path, index);
    return (
    <Draggable index={index} draggableId={String(index)}>
        {provided => (
            <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps} ref={provided.innerRef} >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span="auto" >
                    <Select defaultValue="replace" allowDeselect={false}
                    data={['add', 'replace', 'delete']}
                    {...form.getInputProps(`${path}.${index}.method`)}
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <Autocomplete {...templateProps(form, `${path}.${index}.name`)}
                    leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Name" data={ldapAttributes}
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <TextInput {...templateProps(form, `${path}.${index}.value`)}
                    leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Value"
                    />
                </Grid.Col>
                <Grid.Col span="content">
                    <Group justify="right" gap="xs">
                        <MenuTip label="Copy" Icon={IconCopy} onClick={copy} variant="default" />
                        <MenuTip label="Delete" Icon={IconTrash} onClick={remove} variant="default" />
                    </Group>
                </Grid.Col>
            </Grid>
        )}
    </Draggable>)
}

function Attributes( { form, path, templateProps }: actionProps ) {
    const templatePath = `${path}.attributes`;
    const entries = form.getInputProps(templatePath).value as { method: string, name: string,value: string }[];
    const add = () => form.insertListItem(templatePath, { method: "replace", name: undefined, value: undefined, });
    return (
    <Concealer label='Attributes' open rightSection={
        <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Attribute</Button></Group> } >
        {entries.length===0&&<Center c="dimmed" fz="xs" >No attributes configured.</Center>}
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {entries.map((entry, index) => <Attribute key={index} index={index} entry={entry} form={form} templateProps={templateProps} path={templatePath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Concealer>
  )
}

export default function LdapUpdateAttributes( { form, path, templateProps }: actionProps ) {
    return <Attributes form={form} path={path} templateProps={templateProps} />
}
