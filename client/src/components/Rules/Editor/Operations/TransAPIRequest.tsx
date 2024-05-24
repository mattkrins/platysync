import { ActionIcon, Anchor, Box, Button, Center, Grid, Group, Input, JsonInput, SegmentedControl, Select, SimpleGrid, TextInput, Textarea } from "@mantine/core";
import { IconBraces, IconCloudComputing, IconGripVertical, IconRoute2, IconTrash, IconWorld } from "@tabler/icons-react";
import SelectConnector from "../../../Common/SelectConnector";
import { UseFormReturnType } from "@mantine/form";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const xml = `<user>
  <name>John</name>
  <age>30</age>
</user>`;

function Form( { form, index, templateProps, actionType, templates }: {
    form: UseFormReturnType<Rule>,
    index: number, templateProps: templateProps,
    actionType: string,
    templates: string[],
} ) {
    
    const add = () => form.insertListItem(`${actionType}.${index}.form`, {key:'',value:'', type: 'string'});
    const actions = form.values[actionType] as Action[];
    const data = (actions[index].form || []) as {value:string, [k: string]: unknown;}[];
    return (
    <Box pt={5} >
        <Group justify="end" ><Button onClick={add} variant="light" size="compact-xs" >Add</Button></Group>
        {data.length===0&&<Center c="dimmed" fz="xs" >No form data configured.</Center>}
        <DragDropContext
        onDragEnd={({ destination, source }) => form.reorderListItem(`${actionType}.${index}.form`, { from: source.index, to: destination? destination.index : 0 }) }
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
                            defaultValue="String"
                            data={[{ value: 'string', label: 'String' },{ value: 'file', label: 'File' }]}
                            {...form.getInputProps(`${actionType}.${index}.form.${index2}.type`)}
                            />
                        </Grid.Col>
                        <Grid.Col span={3}>
                            <TextInput
                                placeholder="key"
                                {...templateProps(form, `${actionType}.${index}.form.${index2}.key`, templates)}
                            />
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <TextInput
                                placeholder="value/path"
                                {...templateProps(form, `${actionType}.${index}.form.${index2}.value`, templates)}
                            />
                        </Grid.Col>
                        <Grid.Col span="content">
                            <Group gap={0} justify="flex-end">
                                <ActionIcon onClick={()=>form.removeListItem(`${actionType}.${index}.form`, index2)} variant="subtle" color="red">
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
    );
}


export default function TransAPISend( { form, index, templateProps, actionType, templates }: ActionItem ) {
    const method = form.values[actionType][index].method;
    const mime = form.values[actionType][index].mime;
    return (
        <Box p="xs" pt={0} >
            <SelectConnector
                label="Base Endpoint" withAsterisk
                clearable type="api"
                leftSection={<IconCloudComputing size="1rem" />}
                {...form.getInputProps(`${actionType}.${index}.source`)}
            />
            <TextInput
                label="Target Endpoint URL" mt="md"
                description="Appended to the base API URL."
                leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="/user/add"
                withAsterisk
                {...templateProps(form, `${actionType}.${index}.target`, templates)}
            />
            <Input.Wrapper mt="xs" withAsterisk
            label="Method"
            description={<>
                <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods" >HTTP Method</Anchor> to use for request.
                </>}
            >
            <SegmentedControl fullWidth mt={5}
            {...form.getInputProps(`${actionType}.${index}.method`)}
            defaultValue="get"
            data={[
            { label: 'GET', value: 'get' },
            { label: 'POST', value: 'post' },
            { label: 'PUT', value: 'put' },
            { label: 'DELETE', value: 'delete' },
            ]} />
            </Input.Wrapper>
            {method!=="get"&&<>
            <Input.Wrapper mt="xs" withAsterisk
            label="Data Type"
            description={<>
            <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST" >Content-Type</Anchor> of the body data.
            </>}
            >
            <SegmentedControl fullWidth mt={5}
            {...form.getInputProps(`${actionType}.${index}.mime`)}
            defaultValue="json"
            data={[
            { label: 'JSON', value: 'json' },
            { label: 'TEXT', value: 'text' },
            { label: 'FORM', value: 'form' },
            { label: 'XML', value: 'xml' },
            ]} />
            </Input.Wrapper>
            {mime==="json"?
            <JsonInput mt="xs" autosize
                label="Body Data"
                placeholder='{"name":"John", "age":30, "car":null}'
                {...templateProps(form, `${actionType}.${index}.data`, templates)}
            />:mime==="form"?<Form form={form} index={index} templateProps={templateProps} actionType={actionType} templates={templates} />:
            <Textarea mt="xs" autosize
                label="Body Data"
                placeholder={mime==="xml"?xml:`Hello World`}
                {...templateProps(form, `${actionType}.${index}.data`, templates)}
            />
            }
            </>}
            <SimpleGrid mt="md" cols={{ base: 1, sm: 2 }} >
            <TextInput
                label="Template Key" mt="xs"
                description="Set to store returned / response data in this template key."
                placeholder="response"
                leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                {...templateProps(form, `${actionType}.${index}.response`, templates)}
            />
            {mime==="json"&&<TextInput
                label="Response Path" mt="xs"
                description="Set to store response data with a specific accessor path."
                placeholder="user.0.name"
                leftSection={<IconRoute2 size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                {...templateProps(form, `${actionType}.${index}.path`, templates)}
            />}
            </SimpleGrid>
        </Box>
        )
}
