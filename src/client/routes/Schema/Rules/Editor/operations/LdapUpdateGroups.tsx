import { Grid, Group, Button, Switch, Select } from '@mantine/core';
import { IconCopy, IconGripVertical, IconPlus, IconTag, IconTrash } from '@tabler/icons-react'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { operationProps } from '../operations';
import ExtTextInput from '../../../../../components/ExtTextInput';
import Concealer from '../../../../../components/Concealer';
import MenuTip from '../../../../../components/MenuTip';
import BpEntries from '../BpEntries';

interface SecurityGroup extends operationProps {
    index: number;
    copy(): void;
    remove(): void;
}

function SecurityGroup({ index, copy, remove, rule, props }: SecurityGroup ) {
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
                    {...props(`groups.${index}.method`)}
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <ExtTextInput rule={rule}
                    leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="CN={{name}},OU={{faculty}},OU=Child,DC=domain,DC=com"
                    {...props(`groups.${index}.value`)}
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

function SecurityGroups( { form, path, props, rule, blueprint }: operationProps ) {
    const templatePath = `${path}.groups`;
    const entries = form.getInputProps(templatePath).value as { method: string, value: string, }[];
    const bpEntries = (blueprint?.groups || []) as object[];
    const add = () => form.insertListItem(templatePath, { method: "add", value: undefined, });
    const copy = (e: object) => form.insertListItem(templatePath, structuredClone(e));
    const remove = (i: number) => form.removeListItem(templatePath, i);
    return (
    <Concealer label='Security Groups' open rightSection={
        <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Security Group</Button></Group> } >
        <BpEntries label='security groups' entries={entries} bpEntries={bpEntries} />
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {entries.map((e, i) => <SecurityGroup key={i} props={props} index={i} copy={()=>copy(e)} remove={()=>remove(i)} form={form} rule={rule} path={templatePath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Concealer>
  )
}

export default function LdapUpdateGroups( { props, rule, form, path, ...rest }: operationProps ) {
    return (
    <>
        <SecurityGroups form={form} path={path} rule={rule} props={props} {...rest} />
        <Switch
            label="Sanitize" mt="xs"
            description="Remove any existing groups not listed above"
            {...props("sanitize", { type: 'checkbox' })}
        />
    </>
    )
}