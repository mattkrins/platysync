import { Anchor, Box, Button, Center, Grid, Group, Input, JsonInput, SegmentedControl, Select, SimpleGrid, TextInput, Textarea } from '@mantine/core'
import { IconBraces, IconCopy, IconGripVertical, IconPencil, IconPlus, IconRoute2, IconTrash, IconWorld } from '@tabler/icons-react'
import { actionConfigProps, actionProps } from '../../../../modules/actions'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { UseFormReturnType } from '@mantine/form';
import { templateProps } from '../../../../hooks/useTemplater';
import MenuTip from '../../../../components/MenuTip';
import SecurePasswordInput from '../../../../components/SecurePasswordInput';

const xml = `<user>
  <name>John</name>
  <age>30</age>
</user>`;

function FormValue({ index, template, form, templateProps, path }: { index: number, template: SysTemplate, form: UseFormReturnType<Rule>, templateProps: templateProps, path: string } ) {
    const copy = () => form.insertListItem(path, structuredClone(template));
    const remove = () => form.removeListItem(path, index);
    return (
    <Draggable index={index} draggableId={String(index)}>
        {provided => (
            <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps} ref={provided.innerRef} >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span={2} >
                    <Select
                    defaultValue="String"
                    data={[{ value: 'string', label: 'String' },{ value: 'file', label: 'File' }]}
                    {...form.getInputProps(`${path}.${index}.type`)}
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <TextInput {...templateProps(form, `${path}.${index}.value`)}
                    leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Key"
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <TextInput {...templateProps(form, `${path}.${index}.key`)}
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

function Form({ form, templateProps, path }: { form: UseFormReturnType<Rule>, templateProps: templateProps, path: string }) {
    const formPath = `${path}.form`;
    const formValues = form.getInputProps(formPath).value as FormDataValue[];
    const add = () => form.insertListItem(formPath, { type: "string", key: undefined, value: undefined, });
    return (
    <Box mt="xs">
        <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Template</Button></Group>
        {formValues.length===0&&<Center c="dimmed" fz="xs" >No templates configured.</Center>}
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(formPath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {formValues.map((template, index) => <FormValue key={index} index={index} template={template} form={form} templateProps={templateProps} path={formPath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Box>
    )    
}

export default function TransAPIRequest( { form, path, templateProps }: actionProps ) {
    const method = form.getInputProps(`${path}.method`).value;
    const mime = form.getInputProps(`${path}.mime`).value;
    const formPath = `${path}.form`;
    return (
    <>
    <TextInput
        label="Target Endpoint URL" mt="md"
        description="Appended to the base API URL."
        leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        placeholder="/user/add"
        withAsterisk
        {...templateProps(form, `${path}.target`)}
    />
    <Input.Wrapper mt="xs" withAsterisk
    label="Method"
    description={<>
    <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods" >HTTP Method</Anchor> to use for request.
    </>}
    >
    <SegmentedControl fullWidth mt={5}
    {...form.getInputProps(`${path}.method`)}
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
    {...form.getInputProps(`${path}.mime`)}
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
        {...templateProps(form, `${path}.data`)}
    />:mime==="form"?<Form form={form} templateProps={templateProps} path={path} />:
    <Textarea mt="xs" autosize
        label="Body Data"
        placeholder={mime==="xml"?xml:`Hello World`}
        {...templateProps(form, `${path}.data`)}
    />}
    </>}
    <SimpleGrid mt="xs" cols={mime==="json"?{ base: 1, sm: 2 }:undefined} >
        <TextInput
            label="Template Key" mt="xs"
            description="Set to store returned / response data in this template key."
            placeholder="response"
            leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${path}.response`)}
        />
        {mime==="json"&&<TextInput
            label="Response Path" mt="xs"
            description="Set to store response data with a specific accessor path."
            placeholder="user.0.name"
            leftSection={<IconRoute2 size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${path}.path`)}
        />}
    </SimpleGrid>
    </>
    )
}

export function TransAPIRequestConfig({ form }: actionConfigProps) {
  return (
  <>
        <TextInput
            label="Base API endpoint URL" mt="md"
            description="Prepended to all API target URLs."
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="https://service.com/api/v1"
            withAsterisk
            {...form.getInputProps('endpoint')}
        />
        <Input.Wrapper mt="xs" mb="xs" withAsterisk label="Authentication" >
        <SegmentedControl fullWidth 
        {...form.getInputProps('auth')}
        defaultValue="none"
        data={[
            { label: 'None', value: 'none' },
            { label: 'Basic', value: 'basic' },
            { label: 'Bearer Token', value: 'bearer' },
        ]} />
        </Input.Wrapper>
        {form.values.auth!=="none"&&
        <SecurePasswordInput withAsterisk mb="xs"
        label="Password"
        placeholder={form.values.auth==="basic"?"username:password":"secret"}
        secure={!!form.values.password&&typeof form.values.password !== 'string'}
        unlock={()=>form.setFieldValue("password", "")}
        {...form.getInputProps('password')}
        />}
        <TextInput
            label="Append Query"
            description="Appended to all API target URLs (added to query string)."
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="access_token=secret"
            {...form.getInputProps('append')}
        />
  </>
  )
}