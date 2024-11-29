import { Anchor, Button, Center, Grid, Group, Select, SimpleGrid, Switch, Textarea, TextareaProps, TextInput, useMantineTheme } from '@mantine/core'
import ExtTextInput from '../../../../../components/ExtTextInput'
import { operationProps } from '../operations'
import { IconBraces, IconCopy, IconGripVertical, IconKey, IconPencil, IconPlus, IconRoute2, IconTemplate, IconTrash, IconWorld } from '@tabler/icons-react';
import Concealer from '../../../../../components/Concealer';
import SecurePasswordInput from '../../../../../components/SecurePasswordInput';
import { Draggable, DragDropContext, Droppable } from '@hello-pangea/dnd';
import MenuTip from '../../../../../components/MenuTip';

const xmlPlaceholder = `<user>
  <name>John</name>
  <age>30</age>
</user>`;

const authMethods = [
    { label: 'Basic', value: 'basic' },
    { label: 'Bearer Token', value: 'bearer' },
];

interface Header extends operationProps {
    index: number;
    copy(): void;
    remove(): void;
}

function Header({ index, copy, remove, rule, props }: Header ) {
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
                    {...props(`headers.${index}.key`)}
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <ExtTextInput rule={rule}
                    leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Value"
                    {...props(`headers.${index}.value`)}
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

function BpHeader({ entry }: { entry: object } ) {
    const theme = useMantineTheme();
    const color = theme.colors['blue'][9];
    const keys = Object.keys(entry);
    return (
        <Grid align="center" mt="xs" gutter="xs" >
            {keys.map((k, i) =>
            <Grid.Col span="auto" key={`bp${i}`} >
                <TextInput readOnly size="xs" disabled
                leftSection={<IconTemplate size={16} style={{ display: 'block', opacity: 0.8 }} color={color} />}
                placeholder={k}
                value={entry[k as keyof object]}
                styles={{ input: { borderColor: color } }}
                />
            </Grid.Col>)}
        </Grid>
    )
}

function Headers( { form, path, props, rule, blueprint }: operationProps ) {
    const templatePath = `${path?`${path}.`:''}headers`;
    const bpEntries = (blueprint?.headers || []) as { key: string, value: string, }[];
    const entries = form.getInputProps(templatePath).value as { key: string, value: string, }[];
    const add = () => form.insertListItem(templatePath, { key: undefined, value: undefined, });
    const copy = (e: { key: string, value: string, }) => form.insertListItem(templatePath, structuredClone(e));
    const remove = (i: number) => form.removeListItem(templatePath, i);
    return (
    <Concealer label='Headers' rightSection={
        <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Header</Button></Group> } >
        {(entries.length===0&&bpEntries.length===0)&&<Center c="dimmed" fz="xs" >No headers configured.</Center>}
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {entries.map((e, i) => <Header key={i} props={props} index={i} copy={()=>copy(e)} remove={()=>remove(i)} form={form} rule={rule} path={templatePath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
        {bpEntries.map((e, i) => <BpHeader key={i} entry={e} />)}
    </Concealer>
  )
}

function BasicOptions( { props, rule, blueprint }: operationProps ) {
    const auth = props("auth").value;
   return (
    <Concealer label="Endpoint" open={!blueprint} >
      <ExtTextInput rule={rule} withAsterisk={!blueprint?.endpoint}
            label="Base API endpoint URL"
            description="Prepended to all API target URLs."
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="https://service.com/api/v1"
            {...props("endpoint")}
      />
    <Select mt="xs" label="Authentication Method"
        description={<>
        Method used to <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication" >authenticate</Anchor> the request.
        </>}
        placeholder={"None"}
        data={authMethods}
        {...props("auth")}
    />{(auth||blueprint?.auth)&&
    <SecurePasswordInput
        label="Password" withAsterisk={!blueprint?.password} mt="xs"
        leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder={auth==="basic"?"username:password":"secret"}
        {...props("password", { type: "password" })}
    />}
    </Concealer>)
}

export default function TransAPIRequest( { props, rule, blueprint, ...rest }: operationProps ) {
    const method: string = props("method").value;
    const mime: string = props("mime").value;
    return (
    <>
        <BasicOptions props={props} rule={rule} blueprint={blueprint} {...rest} />
        <Select mt="xs" label="Method"
            description={<>
            Method used to <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods" >send</Anchor> the request.
            </>}
            placeholder="get"
            data={['post','put','delete']}
            {...props("method")}
        />
        {(method||blueprint?.method)&&
        <>
            <Select mt="xs" label="Data Type"
            description={<>
            Content-Type of the sent <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST" >body</Anchor> data.
            </>}
            placeholder="json"
            data={['text','form','xml', 'file']}
            {...props("mime")}
            />
            { !mime ?
            <ExtTextInput<TextareaProps> Component={Textarea} rule={rule} withAsterisk={!blueprint?.data}
                label="Body Data" mt="xs" autosize
                description="JSON data to send in the request."
                placeholder='{"name":"John", "age":30, "car":null}'
                {...props("data")}
            /> :
            { text:
            <ExtTextInput<TextareaProps> Component={Textarea} rule={rule} withAsterisk={!blueprint?.data}
                label="Body Data" mt="xs"  autosize description="Text to send in the request."
                placeholder="Hello World"
                {...props("data")}
            />, xml:
            <ExtTextInput<TextareaProps> Component={Textarea} rule={rule} withAsterisk={!blueprint?.data}
                label="Body Data" mt="xs" autosize description="XML data to send in the request."
                placeholder={xmlPlaceholder}
                {...props("data")}
            />, form:
            <></>,
            file:
            <ExtTextInput rule={rule} withAsterisk={!blueprint?.data}
            label="Body Data" mt="xs" description="Path of the file to stream."
            placeholder="D:/data.zip"
            {...props("data")}
            />
            }[mime]}
        </>}
        <Headers props={props} rule={rule} blueprint={blueprint} {...rest} />
        <SimpleGrid mt="xs" cols={{ base: 1, sm: 2 }} >
            <ExtTextInput rule={rule}
                label="Template Key" mt="xs"
                description="Set to store returned / response data in this template key."
                placeholder="response"
                leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                {...props("key")}
            />
            <ExtTextInput rule={rule}
                label="Response Path" mt="xs"
                description="Set to store response data with a specific accessor path."
                placeholder="users[0].name"
                leftSection={<IconRoute2 size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                {...props("responsePath")}
            />
        </SimpleGrid>
        <Switch label="Send request during evaluation"
        mt="xs" {...props("evaluation", { type: 'checkbox' })}
        />
    </>
    )
  }
  