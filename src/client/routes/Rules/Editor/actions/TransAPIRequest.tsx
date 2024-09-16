import { TextInput, Select, Anchor, JsonInput, Textarea, Box, Button, Center, Grid, Group, SimpleGrid, Switch } from '@mantine/core'
import { IconBraces, IconCopy, IconGripVertical, IconPencil, IconPlus, IconRoute2, IconTrash, IconWorld } from '@tabler/icons-react'
import SecurePasswordInput from '../../../../components/SecurePasswordInput'
import { actionProps } from '../../../../modules/actions'
import usePassword from '../../../../hooks/usePassword';
import Concealer from '../../../../components/Concealer';
import { Draggable, DragDropContext, Droppable } from '@hello-pangea/dnd';
import { UseFormReturnType } from '@mantine/form';
import MenuTip from '../../../../components/MenuTip';

const xmlPlaceholder = `<user>
  <name>John</name>
  <age>30</age>
</user>`;

const authMethods = [
    { label: 'Basic', value: 'basic' },
    { label: 'Bearer Token', value: 'bearer' },
];

function APIOptions( { form, path, templateProps, config, configured }: actionProps ) {
    const { visible, options, secure, unlock } = usePassword(form, `${path}.password`);
    const auth = templateProps(form, `${path}.auth`);
    const authPlaceholder = authMethods.find(a=>a.value===auth.placeholder);
    return (
    <Concealer label={configured?`Endpoint (${configured})`:"Endpoint"} open={!configured} >
        <TextInput withAsterisk={!config}
            label="Base API endpoint URL" mt="md"
            description="Prepended to all API target URLs."
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="https://service.com/api/v1"
            {...templateProps(form, `${path}.endpoint`)}
        />
        <Select mt="xs" label="Authentication"
            description={<>
            Method used to <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication" >authenticate</Anchor> the request.
            </>}
            {...form.getInputProps(`${path}.auth`)}
            placeholder={authPlaceholder?authPlaceholder.label:"None"}
            data={authMethods}
        /> {auth.value&&
        <SecurePasswordInput mt="xs" withAsterisk={!config}
            label="Password" 
            placeholder={auth.value==="basic"?"username:password":"secret"}
            visible={visible}
            secure={secure}
            unlock={unlock}
            rightSectionX={options.buttons}
            {...templateProps(form, `${path}.password`, options)}
        />}
    </Concealer>
  )
}

function FormValue({ index, value, form, templateProps, path }: actionProps & { index: number, value: FormDataValue } ) {
    const copy = () => form.insertListItem(path, structuredClone(value));
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

function Form({ form, path, templateProps }: actionProps) {
    const formPath = `${path}.form`;
    const formValues = form.getInputProps(formPath).value as FormDataValue[];
    const add = () => form.insertListItem(formPath, { type: "string", key: undefined, value: undefined, });
    return (
    <Box mt="xs">
        <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Form Value</Button></Group>
        {formValues.length===0&&<Center c="dimmed" fz="xs" >No templates configured.</Center>}
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(formPath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {formValues.map((value, index) => <FormValue key={index} index={index} value={value} form={form} templateProps={templateProps} path={formPath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Box>
    )    
}

export default function TransAPIRequest( { form, path, templateProps, config, configured }: actionProps ) {
    const method: string = form.getInputProps(`${path}.method`).value;
    const mime: string = form.getInputProps(`${path}.mime`).value;
    return (
    <>
        <APIOptions form={form} path={path} templateProps={templateProps} config={config} configured={configured} />
        <TextInput withAsterisk={!config}
            label="Target Endpoint URL" mt="md"
            description="Appended to the base API URL."
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="/user/add"
            {...templateProps(form, `${path}.target`)}
        />
        <Switch label="Send request during evaluation"
        mt="xs" {...form.getInputProps(`${path}.evaluation`, { type: 'checkbox' })}
        />
        <Select mt="xs" label="Method"
            description={<>
            Method used to <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods" >send</Anchor> the request.
            </>}
            placeholder="get"
            {...form.getInputProps(`${path}.method`)}
            data={['post','put','delete']}
        /> {method&&
        <>
            <Select mt="xs" label="Data Type"
            description={<>
            Content-Type of the sent <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST" >body</Anchor> data.
            </>}
            placeholder="json"
            {...form.getInputProps(`${path}.mime`)}
            data={['text','form','xml']}
            />
            { !mime ?
            <JsonInput mt="xs" autosize
            label="Body Data" description="JSON data to send in the request."
            placeholder='{"name":"John", "age":30, "car":null}'
            {...templateProps(form, `${path}.data`)}
            /> :
            { text:
            <Textarea mt="xs" autosize
            label="Body Data" description="Text to send in the request."
            placeholder="Hello World"
            {...templateProps(form, `${path}.data`)}
            />, xml:
            <Textarea mt="xs" autosize
            label="Body Data" description="XML data to send in the request."
            placeholder={xmlPlaceholder}
            {...templateProps(form, `${path}.data`)}
            />, form:
            <Form form={form} path={path} templateProps={templateProps} config={config} configured={configured} />,
            }[mime]}
        </>}
        <SimpleGrid mt="xs" cols={{ base: 1, sm: 2 }} >
            <TextInput
                label="Template Key" mt="xs"
                description="Set to store returned / response data in this template key."
                placeholder="response"
                leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                {...templateProps(form, `${path}.key`)}
            />
            <TextInput
                label="Response Path" mt="xs"
                description="Set to store response data with a specific accessor path."
                placeholder="users[0].name"
                leftSection={<IconRoute2 size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                {...templateProps(form, `${path}.responsePath`)}
            />
        </SimpleGrid>
    </>
  )
}
