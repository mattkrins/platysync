import { Button, Grid, Group } from '@mantine/core'
import { IconBraces, IconCopy, IconGripVertical, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { operationProps } from '../operations'
import Concealer from '../../../../../components/Concealer'
import ExtTextInput from '../../../../../components/ExtTextInput'
import MenuTip from '../../../../../components/MenuTip'
import BpEntries from '../BpEntries'

interface Template extends operationProps {
    index: number;
    copy(): void;
    remove(): void;
}

function Template({ index, copy, remove, rule, props }: Template ) {
    return (
    <Draggable index={index} draggableId={String(index)}>
        {provided => (
            <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps} ref={provided.innerRef} >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span="auto" >
                    <ExtTextInput rule={rule}
                    leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Key"
                    {...props(`templates.${index}.key`)}
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <ExtTextInput rule={rule}
                    leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Value"
                    {...props(`templates.${index}.value`)}
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

function SysTemplates( { form, path, props, rule, blueprint }: operationProps ) {
    const templatePath = `${path?`${path}.`:''}templates`;
    const entries = form.getInputProps(templatePath).value as { key: string, value: string, }[];
    const bpEntries = (blueprint?.templates || []) as object[];
    const add = () => form.insertListItem(templatePath, { key: undefined, value: undefined, });
    const copy = (e: object) => form.insertListItem(templatePath, structuredClone(e));
    const remove = (i: number) => form.removeListItem(templatePath, i);
    return (
    <Concealer label='Templates' open rightSection={
        <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Template</Button></Group> } >
        <BpEntries label='templates' entries={entries} bpEntries={bpEntries} />
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {entries.map((e, i) => <Template key={`t${i}`} props={props} index={i} copy={()=>copy(e)} remove={()=>remove(i)} form={form} rule={rule} path={path} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Concealer>
  )
}

export default function SysTemplate( { form, path, props, rule, ...rest }: operationProps ) {
    return <SysTemplates form={form} path={path} rule={rule} props={props} {...rest} />
}