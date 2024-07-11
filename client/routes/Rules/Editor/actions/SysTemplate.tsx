import { Button, Center, Grid, Group, Switch, TextInput } from '@mantine/core'
import { IconBraces, IconCopy, IconEdit, IconFolderPlus, IconGripVertical, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { UseFormReturnType } from '@mantine/form'
import { templateProps } from '../../../../hooks/useTemplater';
import MenuTip from '../../../../components/MenuTip'

function Template({ index, template, form, templateProps, path }: { index: number, template: SysTemplate, form: UseFormReturnType<Rule>, templateProps: templateProps, path: string } ) {
    const copy = () => form.insertListItem(path, structuredClone(template));
    const remove = () => form.removeListItem(path, index);
    return (
    <Draggable index={index} draggableId={String(index)}>
        {provided => (
            <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps} ref={provided.innerRef} >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span="auto" >
                    <TextInput {...templateProps(form, `${path}.${index}.key`)}
                    leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Key"
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

export default function SysTemplate( { form, path, templateProps }: actionProps ) {
    const templatePath = `${path}.templates`;
    const templates = form.getInputProps(templatePath).value as SysTemplate[];
    const add = () => form.insertListItem(templatePath, { key: undefined, value: undefined, });
    return (
    <>
    <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Template</Button></Group>
    {templates.length===0&&<Center c="dimmed" fz="xs" >No templates configured.</Center>}
    <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
        <Droppable droppableId="dnd-list" direction="vertical">
        {(provided) => (
        <div {...provided.droppableProps} ref={provided.innerRef}>
            {templates.map((template, index) => <Template key={index} index={index} template={template} form={form} templateProps={templateProps} path={templatePath} />)}
            {provided.placeholder}
        </div>
        )}
    </Droppable>
    </DragDropContext>
    </>
  )
}
