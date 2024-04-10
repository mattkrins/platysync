import { ActionIcon, Box, Button, Center, Grid, Group, Select, TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconBinaryTree2, IconGripVertical, IconTrash } from "@tabler/icons-react";
import SelectConnector from "../../../Common/SelectConnector";
import Concealer from "../../../Common/Concealer";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ldapAttributes } from "../../../../modules/common";
import { SelectCreatable } from "../../../Common/SelectCreatable";

function Attributes( { form, index, templateProps, actionType, templates }: {
    form: UseFormReturnType<Rule>,
    index: number,
    templateProps: templateProps,
    actionType: string,
    sources: string[],
    templates: string[],
} ) {
    const actions = form.values[actionType] as Action[];
    const data = (actions[index].attributes || []);
    return (<>
        {data.length===0&&<Center c="dimmed" fz="xs" >No attributes configured.</Center>}
        <DragDropContext
        onDragEnd={({ destination, source }) => form.reorderListItem(`${actionType}.${index}.attributes`, { from: source.index, to: destination? destination.index : 0 }) }
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
                        <Grid.Col span={2}>
                            <Select
                            defaultValue="Replace"
                            data={['Add', 'Replace', 'Delete']}
                            {...form.getInputProps(`${actionType}.${index}.attributes.${index2}.type`)}
                            />
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <SelectCreatable
                            selectable={ldapAttributes}
                            {...form.getInputProps(`${actionType}.${index}.attributes.${index2}.name`)}
                            createLabel={(query) => `Add Custom Attribute: ${query}`}
                            />
                        </Grid.Col>
                        {(actions[index].attributes[index2].type as string)!=="Delete"&&<Grid.Col span="auto">
                            <TextInput
                                placeholder="Value"
                                {...templateProps(form, `${actionType}.${index}.attributes.${index2}.value`, templates)}
                            />
                        </Grid.Col>}
                        <Grid.Col span="content">
                            <Group gap={0} justify="flex-end">
                                <ActionIcon onClick={()=>form.removeListItem(`${actionType}.${index}.attributes`, index2)} variant="subtle" color="red">
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
        </>
    );
}

export default function UpdateAttributes( { form, index, actionType, sources, templateProps, templates }: ActionItem){
    const actions = form.values[actionType] as Action[];
    if (!actions[index].attributes) form.setFieldValue(`${actionType}.${index}.attributes`, []);
    const addA = () => form.insertListItem(`${actionType}.${index}.attributes`, {name:'',value:'', type: 'Replace'});
    return (
    <Box p="xs" pt={0} >
        <SelectConnector
            label="Target Directory" withAsterisk
            clearable
            leftSection={<IconBinaryTree2 size="1rem" />}
            {...form.getInputProps(`${actionType}.${index}.target`)}
            type="ldap"
            sources={sources}
        />
        <Concealer open label='Attributes' rightSection={<Button onClick={()=>addA()} maw={50} variant="light" size='compact-xs' mt={10}>Add</Button>} >
            <Attributes form={form} index={index} templateProps={templateProps} actionType={actionType} sources={sources} templates={templates} />
        </Concealer>
    </Box>
    )
}
