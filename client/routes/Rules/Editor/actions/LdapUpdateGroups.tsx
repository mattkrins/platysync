import { Grid, Group, Select, TextInput, Button, Center, Switch } from '@mantine/core';
import { IconCopy, IconGripVertical, IconPlus, IconTrash, IconUsersGroup } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { UseFormReturnType } from '@mantine/form';
import MenuTip from '../../../../components/MenuTip';
import Concealer from '../../../../components/Concealer';

function SecurityGroup({ index, entry, form, templateProps, path }:
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
                    <Select defaultValue="add" allowDeselect={false}
                    data={[{ value: 'add', label: 'Add To' },{ value: 'delete', label: 'Remove From' }]}
                    {...form.getInputProps(`${path}.${index}.method`)}
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <TextInput {...templateProps(form, `${path}.${index}.value`)}
                    leftSection={<IconUsersGroup size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="CN={{name}},OU={{faculty}},OU=Child,DC=domain,DC=com"
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

function SecurityGroups( { form, path, templateProps }: actionProps ) {
    const templatePath = `${path}.groups`;
    const entries = form.getInputProps(templatePath).value as { method: string, name: string,value: string }[];
    const add = () => form.insertListItem(templatePath, { method: "add", value: undefined, });
    return (
    <Concealer label='Security Groups' open rightSection={
        <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Group</Button></Group> } >
        {entries.length===0&&<Center c="dimmed" fz="xs" >No security groups configured.</Center>}
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {entries.map((entry, index) => <SecurityGroup key={index} index={index} entry={entry} form={form} templateProps={templateProps} path={templatePath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Concealer>
  )
}

export default function LdapUpdateGroups( { form, path, templateProps }: actionProps ) {
    return (<>
        <SecurityGroups form={form} path={path} templateProps={templateProps} />
        <Switch label="Sanitize" description="Remove any existing groups not listed above"
        mt="xs" {...form.getInputProps(`${path}.sanitize`, { type: 'checkbox' })}
        />
    </>)
}
