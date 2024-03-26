import { ActionIcon, Box, Button, Center, Grid, Group, Switch, TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconAt, IconBinaryTree2, IconFolder, IconGripVertical, IconHierarchy, IconKey, IconTrash, IconUser } from "@tabler/icons-react";
import SelectConnector from "../../../Common/SelectConnector";
import Concealer from "../../../Common/Concealer";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ldapAttributes } from "../../../../modules/common";
import { SelectCreatable } from "../../../Common/SelectCreatable";
import useTemplate, { templateProps } from "../../../../hooks/useTemplate";

function SecurityGroups( { form, index, explore, actionType, sources, templateProps }: {
    form: UseFormReturnType<Rule>,
    index: number, explore: explore,
    actionType: string,
    sources: string[],
    templateProps: templateProps
} ) {
    const actions = form.values[actionType] as Action[];
    const data = (actions[index].groups || []) as string[];
    const modifyCondition = (index2: number)=> () => explore(() => (value: string) =>
    form.setFieldValue(`${actionType}.${index}.groups.${index2}`, `${actions[index].groups[index2]||''}{{${value}}}`), sources );

    const inputProps = (index2: number) =>
    templateProps(modifyCondition(index2), form.getInputProps(`${actionType}.${index}.groups.${index2}`));
  
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
                        <Grid.Col span="auto">
                            <TextInput
                                placeholder="CN={{faculty}},OU={{faculty}},OU=Child,OU=Parent"
                                {...inputProps(index2)}
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

function Attributes( { form, index, explore, actionType, sources, templateProps }: {
    form: UseFormReturnType<Rule>,
    index: number, explore: explore,
    actionType: string, sources: string[],
    templateProps: templateProps
} ) {
    const actions = form.values[actionType] as Action[];
    const data = (actions[index].attributes || []);
    const modifyCondition = (key: string, index2: number)=> () => explore(() => (value: string) =>
    form.setFieldValue(`${actionType}.${index}.attributes.${index2}.${key}`, `${actions[index].attributes[index2][key]||''}{{${value}}}`), sources );
  
    const inputProps = (key: string, index2: number) =>
    templateProps(modifyCondition(key, index2), form.getInputProps(`${actionType}.${index}.attributes.${index2}.${key}`));

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
                        <Grid.Col span="auto">
                            <SelectCreatable
                            selectable={ldapAttributes}
                            {...form.getInputProps(`${actionType}.${index}.attributes.${index2}.name`)}
                            createLabel={(query) => `Add Custom Attribute: ${query}`}
                            />
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <TextInput
                                placeholder="Value"
                                {...inputProps('value', index2)}
                            />
                        </Grid.Col>
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

export default function CreateUser( { form, index, inputProps, explore, actionType, sources, templates }: ActionItem){
    const actions = form.values[actionType] as Action[];
    if (!actions[index].attributes) form.setFieldValue(`${actionType}.${index}.attributes`, []);
    if (!actions[index].groups) form.setFieldValue(`${actionType}.${index}.groups`, []);
    const addA = () => form.insertListItem(`${actionType}.${index}.attributes`, {name:'',value:''});
    const addG = () => form.insertListItem(`${actionType}.${index}.groups`, '');
    const [ templateProps ] = useTemplate(sources, templates);
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
        <TextInput
            label="Canonical Name" withAsterisk
            leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{username}}"
            {...inputProps('cn')}
        />
        <TextInput
            label="User Principal Name" withAsterisk
            leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{username}}@domain.com"
            {...inputProps('upn')}
        />
        <TextInput
            label="SAM Account Name" withAsterisk
            leftSection={<IconHierarchy size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{username}}"
            {...inputProps('sam')}
        />
        <TextInput
            label="Organizational Unit" withAsterisk
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="ou={{faculty}},ou=child,ou=parent"
            {...inputProps('ou')}
        />
        <TextInput
            label="Password"
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{word}}{{rand 1 9}}{{cap (word)}}{{special}}"
            {...inputProps('password')}
        />
        <Switch label="User Enabled" disabled={actions[index].password===""}
        mt="xs" {...form.getInputProps(`${actionType}.${index}.enable`, { type: 'checkbox' })}
        />
        <Concealer open label='Attributes' rightSection={<Button onClick={()=>addA()} maw={50} variant="light" size='compact-xs' mt={10}>Add</Button>} >
            <Attributes form={form} index={index} explore={explore} actionType={actionType} sources={sources} templateProps={templateProps} />
        </Concealer>
        <Concealer open label='Security Groups' rightSection={<Button onClick={()=>addG()} maw={50} variant="light" size='compact-xs' mt={10}>Add</Button>} >
            <SecurityGroups form={form} index={index} explore={explore} actionType={actionType} sources={sources} templateProps={templateProps} />
        </Concealer>
    </Box>
    )
}
