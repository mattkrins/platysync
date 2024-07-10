import { ActionIcon, Alert, Anchor, Button, Center, Grid, Group, Loader, Modal, ScrollArea, SimpleGrid, Stepper, Text, TextInput, Tooltip, UnstyledButton, useMantineTheme } from "@mantine/core";
import Wrapper from "../../components/Wrapper";
import classes from './Editor.module.css';
import { IconAlertCircle, IconCheck, IconDeviceFloppy, IconGripVertical, IconKey, IconPlayerSkipForward, IconPlus, IconRecycle, IconTag, IconTestPipe, IconTrash } from "@tabler/icons-react";
import { provider, providers } from "../../modules/providers";
import { useState } from "react";
import { UseFormReturnType, useForm } from "@mantine/form";
import SplitButton from "../../components/SplitButton";
import useAPI from "../../hooks/useAPI";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { loadConnectors } from "../../providers/schemaSlice";
import { useDispatch } from "../../hooks/redux";
import Concealer from "../../components/Concealer";
import { useDisclosure } from "@mantine/hooks";

const findDuplicateIndexes = (arr: string[]) => {
  const elementMap = new Map();
  const duplicateIndexes: number[] = [];
  arr.forEach((item, index) => {
    if (elementMap.has(item)) {
      duplicateIndexes.push(index);
    } else {
      elementMap.set(item, index);
    }
  });
  return duplicateIndexes;
};

function List( { form, autodetect, detecting, editing, close }: { form: UseFormReturnType<Connector>, autodetect(): void, detecting?: boolean, editing?: boolean, close?(): void } ) {
  const dispatch = useDispatch();
  const { post, error, loading } = useAPI({
    url: `/connector`, form, schema: true,
    then: () => { dispatch(loadConnectors()); if (close) close();  }
  });
  const headers = (form.values.headers || []) as string[];
  const add = () => form.insertListItem('headers', '');
  const clear = () => { form.setFieldValue("headers", []); form.clearErrors(); }
  const save = () => {
    for (const index in form.values.headers) {
      if (!form.values.headers[index]){ form.setFieldError(`headers.${index}`, "Header can not be empty."); return; }
    } const duplicates = findDuplicateIndexes(form.values.headers);
    for (const index in duplicates){ form.setFieldError(`headers.${index}`, "Duplicate header."); return; }
    post();
  }
  return (
  <>
    {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
    <Group justify={editing?"flex-end":"space-between"} mb="xs" >
      {!editing&&<Tooltip label="Save Connector">
        <ActionIcon onClick={save} variant="subtle" color="blue" disabled={headers.length<=0} loading={loading} >
            <IconDeviceFloppy size="1.2rem" stroke={1.5} />
        </ActionIcon>
      </Tooltip>}
      {detecting&&<Group><Loader size="sm" type="dots" /><Text>Autodetecting Headers</Text></Group>}
      <Group mt="xs" mb="xs" justify="flex-end">
        <Tooltip label="Autodetect Headers">
          <ActionIcon onClick={()=>autodetect()} variant="subtle" color="orange" loading={detecting} >
              <IconRecycle size="1.2rem" stroke={1.5} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Add Header">
          <ActionIcon onClick={add} variant="subtle" color="green">
              <IconPlus size="1.2rem" stroke={1.5} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete All">
          <ActionIcon  mr="md" onClick={clear} variant="subtle" color="red"  disabled={headers.length<=0} >
              <IconTrash size="1.2rem" stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
    {(headers.length===0&&!detecting)&&<Center c="dimmed" fz="xs" >No headers configured. <Anchor size="xs" ml={2} mr={2} onClick={add} >Add</Anchor> one to continue.</Center>}
    <ScrollArea.Autosize mah={300} mx="auto" type="scroll" scrollbarSize={2} >
    <DragDropContext
    onDragEnd={({ destination, source }) => form.reorderListItem('headers', { from: source.index, to: destination? destination.index : 0 }) }
    >
    <Droppable droppableId="dnd-list" direction="vertical">
        {(provided) => (
        <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
            {headers.map((_, index) => (
            <Draggable key={index} index={index} draggableId={index.toString()}>
                {(provided) => (
                <Grid gutter="xs" mr="md" align="center" ref={provided.innerRef} {...provided.draggableProps}
                style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
                >
                    <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                        <Group>
                          <IconGripVertical size="1rem" />
                        </Group>
                    </Grid.Col>
                    <Grid.Col span="auto">
                        <TextInput size="xs" 
                        {...form.getInputProps(`headers.${index}`)}
                        />
                    </Grid.Col>
                    <Grid.Col span="content">
                        <Group gap={0} justify="flex-end">
                            {index===0&&<Tooltip label="Default/Primary Key" ><IconKey size="1rem" color="orange" /></Tooltip>}
                            <ActionIcon onClick={()=>form.removeListItem('headers', index)} variant="subtle" color="red">
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
    </ScrollArea.Autosize>
  </>
  );
}

function Headers({ initialValues, close, editing  }: { initialValues: Connector, close?(): void, editing?: UseFormReturnType<Connector> }) {
  const form = useForm<Connector>({ initialValues });
  const { post: autodetect, error, loading: detecting, setError } = useAPI<string[]>({
    url: `/connector/getHeaders`, schema: true, fetch: !editing,
    data: (editing||form).values, method: "post",
    then: (headers) => (editing||form).setFieldValue("headers", headers),
  });
  return (<>
    {error&&<Alert withCloseButton onClose={()=>setError(undefined)} title={<>Failed to autodetect headers <Button onClick={()=>autodetect()} color="red" size="compact-xs" >Retry</Button></>
    } mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
    <List form={editing||form} autodetect={autodetect} detecting={detecting} editing={!!editing} close={close} />
  </>)
}

function ConfigButton( { save, loading, validate, force }: { save(): void, loading?: boolean, validate(): void, force(): void } ) {
  const theme = useMantineTheme();
  return (
    <SplitButton loading={loading} onClick={save} options={[
      {  onClick:()=>validate(), label: 'Validate', leftSection: <IconTestPipe size={16} color={theme.colors.lime[5]}  /> },
      {  onClick:()=>force(), label: 'Force Continue', leftSection: <IconPlayerSkipForward size={16} color={theme.colors.orange[5]}  /> },
      ]} >Continue</SplitButton>
  )
}

function Configure({ provider: { validate, initialValues, id, Options }, config, setConfig }: { provider: provider, config?: Partial<Connector>, setConfig(config: object): void }) {
    const form = useForm<Connector>({ validate, initialValues: (config||initialValues) as Connector });
    const save = () => post().then(()=>setConfig({ ...form.values, id, headers: [] }));
    const force = () => setConfig({ ...form.values, id, headers: [] });
    const { data: valid, post, error, loading } = useAPI({ url: `/connector/validate?creating=true`, form, data: { id }, schema: true, });
    return <>
        {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
        {!!valid&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Validated successfully.</Alert>}
        <TextInput withAsterisk mb="xs"
            label="Connector Name"
            placeholder="name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            {...form.getInputProps('name')}
        />
        <Options form={form} />
        <Group mt="xs" justify="flex-end"><ConfigButton loading={loading} save={save} validate={post} force={force} /></Group>
    </>
}

function NewConnector({ close }: { close(): void, }) {
  const theme = useMantineTheme();
  const [active, setActive] = useState<number>(0);
  const [config, setConfig] = useState<Connector|undefined>(undefined);
  const [provider, setProvider] = useState<provider|undefined>(undefined);
  const useConfig = (data: Connector) => { setConfig(data); setActive(2); }
  return (
  <Wrapper>
    <Stepper size="sm" active={active} onStepClick={setActive} >
      <Stepper.Step label="Select Provider" description={provider&&provider.id} >
          <SimpleGrid cols={2} mt="md">{providers.map(p=>
              <UnstyledButton onClick={()=>{ setProvider(p); setActive(1); }} key={p.id} className={classes.item} >
                  <p.Icon size={32} color={p.color?theme.colors[p.color][6]:undefined} />
                  <Text size="xs" mt={5} >{p.name}</Text>
              </UnstyledButton>)}
          </SimpleGrid>
      </Stepper.Step>
      <Stepper.Step label="Configure" allowStepSelect={!!config} description={config&&config.name} >
        {provider&&<Configure provider={provider} setConfig={useConfig} config={config} />}
      </Stepper.Step>
      <Stepper.Step label="Select Headers" allowStepSelect={false} >
      {!!config&&<Headers initialValues={config} close={close} />}
      </Stepper.Step>
    </Stepper>
  </Wrapper>
  )
}

function EditConnector({ provider: { validate, Options }, initialValues }: { provider: provider, initialValues: Connector, refresh(): void }) {
  const [opened, { toggle }] = useDisclosure(false);
  const theme = useMantineTheme();
  const dispatch = useDispatch();
  const form = useForm<Connector>({ validate, initialValues: structuredClone(initialValues) });
  const { data: success, put, error: e1, loading: l1 } = useAPI({
    url: `/connector/${initialValues.name}`, schema: true,
    data: form.values,
    then: () => dispatch(loadConnectors()),
    catch: (_, errors) => form.setErrors(errors as {}),
  });
  const { data: valid, post: val, error: e2, loading: l2 } = useAPI({
    url: `/connector/validate`, form, schema: true,
  });
  const error = e1||e2;
  const loading = l1||l2;
  const save = () => { form.validate(); if (form.isValid()) put(); }
  const force = () => put({append:"?force=true"});
  return (
  <>
    {!!valid&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Validated successfully.</Alert>}
    {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Connector updated successfully.</Alert>}
    {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
    <TextInput withAsterisk mt="xs" mb="xs"
        label="Connector Name"
        placeholder="name"
        leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        {...form.getInputProps('name')}
    />
    <Options form={form} />
    <Concealer label="Headers" onClick={toggle} isOpen={opened} >{opened&&<Headers initialValues={initialValues} editing={form} />}</Concealer>
    <Group justify="right" mt="md">
      <SplitButton disabled={form.values.headers.length<=0} loading={loading} onClick={()=>save()} leftSection={<IconDeviceFloppy size={16}  />} options={[
            {  onClick:()=>val(), label: 'Validate', leftSection: <IconTestPipe color={theme.colors['lime'][6]} size={16}  /> },
            {  onClick:()=>force(), label: 'Force Save', leftSection: <IconDeviceFloppy color={theme.colors['orange'][6]} size={16}  /> },
      ]}>Save</SplitButton>
    </Group>
  </>)
}

function Content({ connector, refresh, adding, close }: { connector: Connector, refresh(): void, adding: boolean, close(): void, }) {
  const provider = providers.find(p=>p.id===connector.id);
  return ( adding? <NewConnector close={close} /> : provider&&<EditConnector initialValues={connector} provider={provider} refresh={refresh} /> )
}

export default function Editor({ editing, close, refresh }: { editing?: [Connector,boolean], close(): void, refresh(): void }) {
    const adding = (editing && editing[0] && !editing[1]) || false ;
    return (
      <Modal size="xl" opened={!!editing} title={adding?undefined:"Edit Connector"} onClose={close} styles={adding?{content:{background:"none"},header:{background:"none"}}:undefined} closeOnClickOutside={!adding} >
        {editing&&<Content connector={editing[0]} refresh={refresh} adding={adding} close={close} />}
      </Modal>
    );
  }