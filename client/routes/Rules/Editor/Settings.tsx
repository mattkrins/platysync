import { Box, Grid, Group, Select, TextInput, Text, ActionIcon, Modal, Button, SimpleGrid, Paper, useMantineTheme, Textarea, Switch, Tooltip, Divider, Anchor } from "@mantine/core";
import { UseFormReturnType, isNotEmpty, useForm } from "@mantine/form";
import { IconGripVertical, IconKey, IconPencil, IconPlus, IconTable, IconTag, IconTrash } from "@tabler/icons-react";
import SelectConnector from "../../../components/SelectConnector";
import { useMemo, useState } from "react";
import { useConnectors } from "../../../hooks/redux";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { provider } from "../../../modules/providers";
import MenuTip from "../../../components/MenuTip";
import useTemplater from "../../../hooks/useTemplater";
import { useRule } from "./Editor";

function Source({ index, source, form, edit }: { index: number, source: Source, form: UseFormReturnType<Rule>, edit(source: Source, index: number): void }) {
    const theme = useMantineTheme();
    const { proConnectors } = useConnectors();
    const foreignProvider = proConnectors.find(c=>c.name===source.foreignName) || {} as Connector&provider;
    const primaryProvider = proConnectors.find(c=>c.name===source.primaryName) || {} as Connector&provider;
    const remove = () => form.removeListItem(`sources`, index);
    const dependancy = form.values.sources.find(s=>s.primaryName===source.foreignName);
    return (
        <Paper mb="xs" p={4} withBorder >
        <Grid columns={20} justify="space-between"  align="center" gutter={0} >
            <Grid.Col span={1} pl="md">
            {index+1}.
            </Grid.Col>
            <Grid.Col span={16}>
                <Group>
                    <foreignProvider.Icon size={20} color={foreignProvider.color?theme.colors[foreignProvider.color][6]:undefined} />
                    {foreignProvider.name}
                    <Divider orientation="vertical" />
                    <primaryProvider.Icon size={20} color={primaryProvider.color?theme.colors[primaryProvider.color][6]:undefined} />
                    <Text c="dimmed" >{primaryProvider.name}</Text>
                </Group>
            </Grid.Col>
            <Grid.Col span={3} miw={120}>
                    <Group gap="xs" justify="flex-end">
                        <MenuTip label="Edit" Icon={IconPencil} onClick={()=>edit(source, index)} color="orange" variant="subtle" />
                        <MenuTip label={dependancy?"Has dependancies":"Delete"} disabled={!!dependancy} Icon={IconTrash} onClick={remove} color="red" variant="subtle" />
                    </Group>
            </Grid.Col>
        </Grid>
    </Paper>
    )
}

const validate = {
    foreignName: isNotEmpty('Foreign connector must not be empty.'),
    primaryName: isNotEmpty('Primary connector must not be empty.'),
}

function SourceModal({ join, index, adding, sources, rule, close }: { join: Source, index?: number, adding: boolean, sources: string[], rule: UseFormReturnType<Rule>, close(): void }) {
    const { proConnectors } = useConnectors();
    const { usedContexts } = useRule(rule);
    const form = useForm<Source>({ validate, initialValues: structuredClone(join) });
    const add = () => {
        form.validate(); if (!form.isValid()) return;
        rule.insertListItem('sources', form.values);
        close();
    }
    const remove = () => {
        rule.removeListItem(`sources`, index||0);
        close();
    }
    const edit = () => {
        form.validate(); if (!form.isValid()) return;
        rule.setFieldValue(`sources.${index}.foreignKey`, form.values.foreignKey||null);
        rule.setFieldValue(`sources.${index}.primaryName`, form.values.primaryName||null);
        rule.setFieldValue(`sources.${index}.primaryKey`, form.values.primaryKey||null);
        rule.setFieldValue(`sources.${index}.inCase`, form.values.inCase||false);
        rule.setFieldValue(`sources.${index}.require`, form.values.require||false);
        close();
    }
    const foreignName = form.values.foreignName;
    const primaryName = form.values.primaryName;
    const foreignProvider = proConnectors.find(c=>c.name===foreignName) || {} as Connector&provider;
    const foreignPlaceholder = !foreignName ? 'Foreign Key' : ( foreignProvider.headers ? foreignProvider.headers[0]: undefined );
    const primaryProvider = proConnectors.find(c=>c.name===primaryName) || {} as Connector&provider;
    const dependancy = rule.values.sources.find(s=>s.primaryName===join.foreignName);
    return (
    <>
        <Text size="xs" c="dimmed" >Join connectors with relational keys, similar to an SQL join.</Text>
        <Text size="xs" c="dimmed" >The Foreign (From) and Primary (To) connector must have headers with matching data.</Text>
        <Grid pt="xs" >
            <Grid.Col span={7}>
                <SelectConnector label="Join Data From" placeholder="Foreign Connector" withAsterisk
                removeNames={sources} withinPortal clearable disabled={!adding}
                {...form.getInputProps(`foreignName`)}
                onChange={(v)=>{
                    form.getInputProps(`foreignName`).onChange(v);
                    form.setFieldValue(`foreignKey`, null as unknown as string);
                }}
                />
            </Grid.Col>
            <Grid.Col span={5}>
                <Select label="Using Key / Header" searchable clearable leftSection={<IconKey size="1rem" />}
                placeholder={foreignPlaceholder}
                data={foreignProvider.headers} disabled={!foreignName}
                rightSection={foreignProvider.Icon?<foreignProvider.Icon size={20} />:undefined}
                {...form.getInputProps(`foreignKey`)}
                />
            </Grid.Col>
        </Grid>
        <Grid>
            <Grid.Col span={7}>
                <SelectConnector label="Join Data To" placeholder="Primary Connector" withAsterisk
                names={sources} removeNames={usedContexts} withinPortal clearable
                {...form.getInputProps(`primaryName`)}
                onChange={(v)=>{
                    form.getInputProps(`primaryName`).onChange(v);
                    form.setFieldValue(`primaryKey`, null as unknown as string);
                }}  
                />
            </Grid.Col>
            <Grid.Col span={5}>
                <Select label={`Key / Header Matching '${form.values.foreignKey?form.values.foreignKey:foreignPlaceholder}'`} searchable clearable leftSection={<IconKey size="1rem" />}
                placeholder={!primaryName?'Primary Key':(primaryProvider.headers ? primaryProvider.headers[0]: undefined)}
                data={primaryProvider.headers} disabled={!primaryName}
                rightSection={primaryProvider.Icon?<primaryProvider.Icon size={20} />:undefined}
                {...form.getInputProps(`primaryKey`)}
                />
            </Grid.Col>
        </Grid>
        <Grid>
            <Grid.Col span={5}>
                <Switch label="Case Insensitive" description="Data will be matched regardless of case." mt="xs" {...form.getInputProps('inCase', { type: 'checkbox' })} />
            </Grid.Col>
            <Grid.Col span={7}>
                <Switch label="Required" description="If no match is found, each row, entry, user, etc will be skipped." mt="xs" {...form.getInputProps('require', { type: 'checkbox' })} />
            </Grid.Col>
        </Grid>
        <Group justify={adding?"flex-end":"space-between"} mt="md">
          {!adding&&<Tooltip hidden={!dependancy} color="red" label={dependancy?"Has dependancies":undefined} ><Button disabled={!!dependancy} color="red" onClick={remove} >Remove</Button></Tooltip>}
          <Button onClick={adding?add:edit} >{adding ? "Join Data" : "Save"}</Button>
        </Group>
    </>)
}

function SourceEditor({ editing, close, sources, form }: { editing?: [Source,number|undefined,boolean], close(): void, sources: string[], form: UseFormReturnType<Rule> }) {
    const adding = (editing && editing[0] && !editing[2]) || false ;
    return (
    <Modal opened={!!editing} size="xl" onClose={close} title={adding ? "Add Source" : "Edit Source"}>
        {editing&&<SourceModal join={editing[0]} index={editing[1]} adding={adding} sources={sources} rule={form} close={close} />}
    </Modal>
    );
}

function ContextRow({ index, context, form, edit }: { index: number, context: Context, form: UseFormReturnType<Rule>, edit(context: Context, index: number): void }) {
    const theme = useMantineTheme();
    const { proConnectors } = useConnectors();
    const provider = proConnectors.find(c=>c.name===context.name) || {} as Connector&provider;
    const remove = () => form.removeListItem(`contexts`, index);
    return <Draggable key={index} index={index} draggableId={index.toString()}>
    {(provided) => (
    <Paper mb="xs" p={4} withBorder  {...provided.draggableProps} ref={provided.innerRef} >
        <Grid justify="space-between"  align="center" >
            <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                <Group justify="space-between">
                    <IconGripVertical size="1.2rem" />
                    <Group visibleFrom="xl" ><provider.Icon size={20} color={provider.color?theme.colors[provider.color][6]:undefined} /></Group>
                </Group>
            </Grid.Col>
            <Grid.Col span={9} style={{ cursor: 'grab' }} {...provided.dragHandleProps} >{provider.name}</Grid.Col>
            <Grid.Col span={2} miw={120}>
                    <Group gap="xs" justify="flex-end">
                        <MenuTip label="Edit" Icon={IconPencil} onClick={()=>edit(context, index)} color="orange" variant="subtle" />
                        <MenuTip label="Delete" Icon={IconTrash} onClick={remove} color="red" variant="subtle" />
                    </Group>
            </Grid.Col>
        </Grid>
    </Paper>)}
    </Draggable>
}


function ContextModal({ join, index, adding, rule, close }: { join: Context, index?: number, adding: boolean, rule: UseFormReturnType<Rule>, close(): void }) {
    const form = useForm<Context>({ validate: {
        name: isNotEmpty('Connector must not be empty.'),
    }, initialValues: structuredClone(join) });
    const { proConnectors } = useConnectors();
    const provider = proConnectors.find(c=>c.name===form.values.name);
    const { templateSources, contextSources } = useRule(rule);
    const add = () => {
        form.validate(); if (!form.isValid()) return;
        rule.insertListItem('contexts', form.values);
        close();
    }
    const remove = () => {
        rule.removeListItem(`contexts`, index||0);
        close();
    }
    const edit = () => {
        form.validate(); if (!form.isValid()) return;
        for (const key of Object.keys(form.values)) rule.setFieldValue(`contexts.${index}.${key}`, form.values[key]||null);
        close();
    }
    return (
    <>
        <Text size="xs" c="dimmed" >Add a connector <b>without</b> a relational key to the rule scope.</Text>
        <Text size="xs" c="dimmed" >These can be used in conditions and actions, but do <b>not</b> provide any template data.</Text>
        <SelectConnector label="Connector" pt="xs" withAsterisk
        names={contextSources} withinPortal clearable disabled={!adding}
        {...form.getInputProps(`name`)}
        onChange={(v)=>{
            form.reset();
            form.getInputProps(`name`).onChange(v);
        }}
        />
        {(provider&&provider.Context)&&<provider.Context form={form} sources={templateSources} rule={rule} />}
        <Group justify={adding?"flex-end":"space-between"} mt="md">
          {!adding&&<Button color="red" onClick={remove} >Remove</Button>}
          <Button onClick={adding?add:edit} >{adding ? "Add" : "Save"}</Button>
        </Group>
    </>)
}

function ContextEditor({ editing, close, form }: { editing?: [Context,number|undefined,boolean], close(): void, form: UseFormReturnType<Rule> }) {
    const adding = (editing && editing[0] && !editing[2]) || false ;
    return (
    <Modal opened={!!editing} size="xl" onClose={close} title={adding ? "Add Connector" : "Edit Connector"}>
        {editing&&<ContextModal join={editing[0]} index={editing[1]} adding={adding} rule={form} close={close} />}
    </Modal>
    );
}

export default function Settings( { form, setActiveTab }: { form: UseFormReturnType<Rule>, setActiveTab(t: string): void } ) {
    const { sources, templateSources, primaryHeaders, displayExample, contextSources } = useRule(form);
    const { templateProps, explorer } = useTemplater({names:templateSources});
    const [ editingSource, setEditingSource ] = useState<[Source,number|undefined,boolean]|undefined>(undefined);
    const [ editingContext, setEditingContext ] = useState<[Context,number|undefined,boolean]|undefined>(undefined);
    const { proConnectors } = useConnectors();
    const addSource = () => setEditingSource([{ foreignName: null, primaryName: null } as unknown as Source,undefined,false]);
    const addContext = () => setEditingContext([{ name: null } as unknown as Context,undefined,false]);
    const editSource = (source: Source, index: number) => setEditingSource([source,index,true]);
    const editContext = (context: Context, index: number) => setEditingContext([context,index,true]);
    
    const changePrimary = () => {
        form.setFieldValue("primaryKey", null as unknown as string);
        form.setFieldValue("sources", []);
        form.setFieldValue("contexts", []);
    }
    return (
    <Box> {explorer}
        <SourceEditor editing={editingSource} close={()=>setEditingSource(undefined)} sources={sources} form={form} />
        <ContextEditor editing={editingContext} close={()=>setEditingContext(undefined)} form={form} />
        <TextInput
            label="Rule Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="Rule Name"
            withAsterisk mb="xs"
            {...form.getInputProps('name')}
        />
        <Grid>
            <Grid.Col span={7}>
                <SelectConnector
                label="Primary Data Source"
                description="Iterate over and evaluate conditions for each row, entry, user, etc in this connector."
                {...form.getInputProps('primary')} clearable
                onChange={(v)=>{form.getInputProps('primary').onChange(v); changePrimary(); }}
                />
            </Grid.Col>
            <Grid.Col span={5}>
                <Select
                label="Primary Key"
                description="Unique identifier for each row."
                placeholder={primaryHeaders[0] ? primaryHeaders[0] : 'id'}
                data={primaryHeaders}
                disabled={!form.values.primary} clearable
                searchable leftSection={<IconKey size="1rem" />}
                {...form.getInputProps('primaryKey')}
                />
            </Grid.Col>
        </Grid>
        <Group grow justify="apart" mb="xs" mt="xs" gap="xs">
            <SimpleGrid cols={1} verticalSpacing={0} >
                <Text size="sm">Secondary Data Sources</Text>
                <Text size="xs" c="dimmed" >Join connectors with relational keys.</Text>
            </SimpleGrid>
            <Group justify="right" gap="xs" >
                <Tooltip label="Add Source" >
                    <ActionIcon size="lg" variant="default" disabled={!form.values.primary||(sources.length)>=proConnectors.length} onClick={addSource} >
                        <IconPlus size={15} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Group>
        {(form.values.sources||[]).map((source, index)=> <Source key={index} index={index} source={source} form={form} edit={editSource} />)}
        <Group grow justify="apart" mb="xs" mt="xs" gap="xs">
            <SimpleGrid cols={1} verticalSpacing={0} >
                <Text size="sm">Additional Connectors</Text>
                <Text size="xs" c="dimmed" >Use connectors <b>without</b> relational keys.</Text>
            </SimpleGrid>
            <Group justify="right" gap="xs" >
                <Tooltip label="Add Connector" >
                    <ActionIcon size="lg" variant="default" disabled={!form.values.primary||contextSources.length<=0} onClick={addContext} >
                        <IconPlus size={15} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Group>
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem('contexts', { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                {(form.values.contexts||[]).map((context, index)=> <ContextRow key={index} index={index} context={context} form={form} edit={editContext} />)}
            </div>
            )}
            </Droppable>
        </DragDropContext>
        <TextInput
            label="Entry Display Name" mt="xs" disabled={!form.values.primary}
            description={<>First {!form.values.primary?'column ':<Anchor size="xs" onClick={()=>setActiveTab("columns")} >column </Anchor>}
            displayed on each result row to identify each row, entry, user, etc.</>}
            leftSection={<IconTable size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder={displayExample}
            {...templateProps(form, 'display', { disabled: !form.values.primary } )}
        />
        <Switch label="Enable Scheduling" description="Enables execution through scheduling" mt="xs" {...form.getInputProps('enabled', { type: 'checkbox' })} />
        <Switch label="Logging Enabled" description="Execution results become accessible via the log browser" mt="xs" {...form.getInputProps('log', { type: 'checkbox' })} />
        <Textarea
            label="Rule Description" mt="xs"
            placeholder="Describe what this rule does. Displayed on the rules overview page."
            {...form.getInputProps('description')}
        />
    </Box>)
}
