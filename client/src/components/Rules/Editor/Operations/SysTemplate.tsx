import { ActionIcon, Box, Button, Center, Grid, Group, TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconCode, IconGripVertical, IconTrash } from "@tabler/icons-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function Template( { form, index, explore, actionType }:{
    form: UseFormReturnType<Rule>,
    index: number,
    explore: explore,
    actionType: string
},){
    const actions = actionType==="after_actions"?form.values.after_actions : form.values.actions||[];
    if (!actions[index].templates) form.setFieldValue(`${actionType}.${index}.templates`, []);
    const add = () => form.insertListItem(`${actionType}.${index}.templates`, {name:'',value:''});

    const data = (actions[index].templates || []);
    const modifyCondition = (key: string, index2: number)=> () => explore(() => (value: string) =>
    form.setFieldValue(`${actionType}.${index}.templates.${index2}.${key}`, `${actions[index].templates[index2][key]||''}{{${value}}}`) );
    const explorer = (key: string, index2: number) => <ActionIcon
    onClick={modifyCondition(key, index2)}
    variant="subtle" ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }} />
    </ActionIcon>
  
    return (
    <Box pt={5} >
        <Group justify="end" ><Button onClick={add} variant="light" size="compact-xs" >Add</Button></Group>
        <Box p="xs" pt={0} >
            {data.length===0&&<Center c="dimmed" fz="xs" >No templates configured.</Center>}
            <DragDropContext
            onDragEnd={({ destination, source }) => form.reorderListItem(`${actionType}.${index}.templates`, { from: source.index, to: destination? destination.index : 0 }) }
            >
            <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                    {data.map((_, index2) => (
                    <Draggable key={index2} index={index2} draggableId={index2.toString()}>
                        {(provided) => (
                        <Grid gutter="xs" align="center" ref={provided.innerRef} mt="xs" {...provided.draggableProps}
                        style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
                        >
                            <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                                <Group><IconGripVertical size="1.2rem" /></Group>
                            </Grid.Col>
                            <Grid.Col span="auto">
                                <TextInput
                                    placeholder="Name"
                                    {...form.getInputProps(`${actionType}.${index}.templates.${index2}.name`)}
                                    rightSection={explorer('name', index2)}
                                />
                            </Grid.Col>
                            <Grid.Col span="auto">
                                <TextInput
                                    placeholder="Value"
                                    {...form.getInputProps(`${actionType}.${index}.templates.${index2}.value`)}
                                    rightSection={explorer('value', index2)}
                                />
                            </Grid.Col>
                            <Grid.Col span="content">
                                <Group gap={0} justify="flex-end">
                                    <ActionIcon onClick={()=>form.removeListItem(`${actionType}.${index}.templates`, index2)} variant="subtle" color="red">
                                        <IconTrash size="1.2rem" stroke={1.5} />
                                    </ActionIcon>
                                </Group>
                            </Grid.Col>
                        </Grid>
                        )}
                    </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Box>
    </Box>
    )
}
