import { ActionIcon, Box, Button, Center, Grid, Group, Select, Switch, TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconAt, IconBinaryTree2, IconCode, IconGripVertical, IconTrash } from "@tabler/icons-react";
import SelectConnector from "../../../Common/SelectConnector";
import Concealer from "../../../Common/Concealer";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function Groups( { form, index, explore, actionType }: { form: UseFormReturnType<Rule>, index: number, explore: explore, actionType: string } ) {
    const actions = form.values[actionType] as Action[];
    const data = (actions[index].groups || []) as {value:string, [k: string]: unknown;}[];
    const modifyCondition = (key: string, index2: number)=> () => explore(() => (value: string) =>
    form.setFieldValue(`${actionType}.${index}.groups.${index2}.${key}`, `${data[index2][key]||''}{{${value}}}`) );
    const explorer = (key: string, index2: number) => <ActionIcon
    onClick={modifyCondition(key, index2)}
    variant="subtle" ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }} />
    </ActionIcon>
  
    return (<>
        {data.length===0&&<Center c="dimmed" fz="xs" >No security groups configured.</Center>}
        <DragDropContext
        onDragEnd={({ destination, source }) => form.reorderListItem(`${actionType}.${index}.groups`, { from: source.index, to: destination? destination.index : 0 }) }
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
                            data={[{ value: 'Add', label: 'Add To' },{ value: 'Delete', label: 'Remove From' }]}
                            {...form.getInputProps(`${actionType}.${index}.groups.${index2}.type`)}
                            />
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <TextInput
                                placeholder="CN={{faculty}},OU={{faculty}},OU=Child,OU=Parent"
                                {...form.getInputProps(`${actionType}.${index}.groups.${index2}.value`)}
                                rightSection={explorer('value', index2)}
                            />
                        </Grid.Col>
                        <Grid.Col span="content">
                            <Group gap={0} justify="flex-end">
                                <ActionIcon onClick={()=>form.removeListItem(`${actionType}.${index}.groups`, index2)} variant="subtle" color="red">
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

export default function DirUpdateSec( { form, index, explore, explorer, actionType }: ActionItem){
    const actions = form.values[actionType] as Action[];
    if (!actions[index].groups) form.setFieldValue(`${actionType}.${index}.groups`, []);
    const addA = () => form.insertListItem(`${actionType}.${index}.groups`, {name:'',value:'', type: 'Add'});
    return (
    <Box p="xs" pt={0} >
        <SelectConnector
            label="Target Directory" withAsterisk
            clearable
            leftSection={<IconBinaryTree2 size="1rem" />}
            {...form.getInputProps(`${actionType}.${index}.target`)}
            type="ldap"
        />
        <TextInput
            label="User Principal Name" withAsterisk
            leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{username}}@domain.com"
            {...form.getInputProps(`${actionType}.${index}.upn`)}
            rightSection={explorer('upn')}
        />
        <Switch label="Remove from all groups not listed in this action"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.clean`, { type: 'checkbox' })}
        />
        <Concealer open label='Security Groups' rightSection={<Button onClick={()=>addA()} maw={50} variant="light" size='compact-xs' mt={10}>Add</Button>} >
            <Groups form={form} index={index} explore={explore} actionType={actionType} />
        </Concealer>
    </Box>
    )
}
