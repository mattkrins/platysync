import { Autocomplete, AutocompleteProps, Button, Grid, Group, Select } from '@mantine/core'
import { IconCopy, IconGripVertical, IconPencil, IconPlus, IconTag, IconTrash } from '@tabler/icons-react'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { operationProps } from '../operations';
import ExtTextInput from '../../../../../components/ExtTextInput';
import Concealer from '../../../../../components/Concealer';
import MenuTip from '../../../../../components/MenuTip';
import { ldapAttributes } from '../../../../../modules/ldap';
import BpEntries from '../BpEntries';

interface Attribute extends operationProps {
    index: number;
    copy(): void;
    remove(): void;
}

function Attribute({ index, copy, remove, rule, props }: Attribute ) {
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
                    {...props(`attributes.${index}.method`)}
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <ExtTextInput<AutocompleteProps> Component={Autocomplete} rule={rule}
                    leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Name" data={ldapAttributes}
                    {...props(`attributes.${index}.name`)}
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <ExtTextInput rule={rule}
                    leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Value"
                    {...props(`attributes.${index}.value`)}
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

function Attributes( { form, path, rule, props, blueprint }: operationProps ) {
    const templatePath = `${path}.attributes`;
    const entries = form.getInputProps(templatePath).value as { name: string,value: string }[];
    const bpEntries = (blueprint?.attributes || []) as object[];
    const add = () => form.insertListItem(templatePath, { name: undefined, value: undefined, });
    const copy = (e: object) => form.insertListItem(templatePath, structuredClone(e));
    const remove = (i: number) => form.removeListItem(templatePath, i);
    return (
    <Concealer label='Attributes' open rightSection={
        <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Attribute</Button></Group> } >
        <BpEntries label='attributes' entries={entries} bpEntries={bpEntries} />
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {entries.map((e, i) => <Attribute key={i} props={props} index={i} copy={()=>copy(e)} remove={()=>remove(i)} form={form} rule={rule} path={templatePath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Concealer>
  )
}

export default function LdapUpdateAttributes( { props, rule, form, path, ...rest }: operationProps ) {
    return <Attributes form={form} path={path} rule={rule} props={props} {...rest} />
}
