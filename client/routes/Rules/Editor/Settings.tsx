import { Box, Grid, Group, Select, TextInput, Text, ActionIcon, Modal, Button, SimpleGrid, Paper, useMantineTheme, Textarea, Switch, Tooltip } from "@mantine/core";
import { UseFormReturnType, isNotEmpty, useForm } from "@mantine/form";
import { IconGripVertical, IconKey, IconPencil, IconPlus, IconTable, IconTag, IconTrash } from "@tabler/icons-react";
import SelectConnector from "../../../components/SelectConnector";
import { useMemo, useState } from "react";
import { useConnectors } from "../../../hooks/redux";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { provider } from "../../../modules/providers";
import MenuTip from "../../../components/MenuTip";
import useTemplater from "../../../hooks/useTemplater";

function Source({ index, source, form, edit }: { index: number, source: Source, form: UseFormReturnType<Rule>, edit(source: Source, index: number): void }) {
    const theme = useMantineTheme();
    const { proConnectors } = useConnectors();
    const provider = proConnectors.find(c=>c.name===source.foreignName) || {} as Connector&provider;
    const remove = () => form.removeListItem(`sources`, index);
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
                        <MenuTip label="Edit" Icon={IconPencil} onClick={()=>edit(source, index)} color="orange" variant="subtle" />
                        <MenuTip label="Delete" Icon={IconTrash} onClick={remove} color="red" variant="subtle" />
                    </Group>
            </Grid.Col>
        </Grid>
    </Paper>)}
    </Draggable>
}

const validate = {
    foreignName: isNotEmpty('Foreign connector must not be empty.'),
    primaryName: isNotEmpty('Primary connector must not be empty.'),
}

function SourceModal({ join, index, adding, sources, rule, close }: { join: Source, index?: number, adding: boolean, sources: string[], rule: UseFormReturnType<Rule>, close(): void }) {
    const { proConnectors } = useConnectors();
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
        close();
    }
    const foreignName = form.values.foreignName;
    const primaryName = form.values.primaryName;
    const foreignProvider = proConnectors.find(c=>c.name===foreignName) || {} as Connector&provider;
    const foreignPlaceholder = !foreignName ? 'Foreign Key' : ( foreignProvider.headers ? foreignProvider.headers[0]: undefined );
    const primaryProvider = proConnectors.find(c=>c.name===primaryName) || {} as Connector&provider;
    return (<>
        <Grid>
            <Grid.Col span={7}>
                <SelectConnector label="Join Data From" placeholder="Foreign Connector"
                removeNames={sources} provider withinPortal clearable disabled={!adding}
                {...form.getInputProps(`foreignName`)}
                onChange={(v)=>{
                    form.getInputProps(`foreignName`).onChange(v);
                    form.setFieldValue(`foreignKey`, null as unknown as string);
                }}
                />
            </Grid.Col>
            <Grid.Col span={5}>
                <Select label="Using Key" searchable clearable leftSection={<IconKey size="1rem" />}
                placeholder={foreignPlaceholder}
                data={foreignProvider.headers} disabled={!foreignName}
                rightSection={foreignProvider.Icon?<foreignProvider.Icon size={20} />:undefined}
                {...form.getInputProps(`foreignKey`)}
                />
            </Grid.Col>
        </Grid>
        <Grid>
            <Grid.Col span={7}>
                <SelectConnector label="Join Data To" placeholder="Primary Connector"
                names={sources} provider withinPortal clearable
                {...form.getInputProps(`primaryName`)}
                onChange={(v)=>{
                    form.getInputProps(`primaryName`).onChange(v);
                    form.setFieldValue(`primaryKey`, null as unknown as string);
                }}  
                />
            </Grid.Col>
            <Grid.Col span={5}>
                <Select label={`Key Matching '${form.values.foreignKey?form.values.foreignKey:foreignPlaceholder}'`} searchable clearable leftSection={<IconKey size="1rem" />}
                placeholder={!primaryName?'Primary Key':(primaryProvider.headers ? primaryProvider.headers[0]: undefined)}
                data={primaryProvider.headers} disabled={!primaryName}
                rightSection={primaryProvider.Icon?<primaryProvider.Icon size={20} />:undefined}
                {...form.getInputProps(`primaryKey`)}
                />
            </Grid.Col>
        </Grid>
        <Group justify={adding?"flex-end":"space-between"} mt="md">
          {!adding&&<Button color="red" onClick={remove} >Remove</Button>}
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

export default function Settings( { form, used, sources }: { form: UseFormReturnType<Rule>, used: string[], sources: string[] } ) {
    const { templateProps, explorer } = useTemplater({names:sources});
    const [ editingSource, setEditingSource ] = useState<[Source,number|undefined,boolean]|undefined>(undefined);
    const { proConnectors } = useConnectors();
    const primary = useMemo(()=>proConnectors.find((item) => item.name === form.values.primary), [ form.values.primary ]);
    const primaryHeaders = primary ? primary.headers : [];
    const add = () => setEditingSource([{ foreignName: null, primaryName: null } as unknown as Source,undefined,false]);
    const edit = (source: Source, index: number) => setEditingSource([source,index,true]);
    
    const changePrimary = () => {
        form.setFieldValue("primaryKey", null as unknown as string);
        form.setFieldValue("sources", []);
    }
    return (
    <Box> {explorer}
        <SourceEditor editing={editingSource} close={()=>setEditingSource(undefined)} sources={sources} form={form} />
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
                <Text size="xs" c="dimmed" >Join connectors with relational keys for additional data.</Text>
            </SimpleGrid>
            <Group justify="right" gap="xs" >
                <Tooltip label="Add Source" >
                    <ActionIcon size="lg" variant="default" disabled={!form.values.primary||sources.length>=proConnectors.length} onClick={add} >
                        <IconPlus size={15} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Group>
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem('sources', { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                {(form.values.sources||[]).map((source, index)=> <Source index={index} source={source} form={form} edit={edit} />)}
            </div>
            )}
            </Droppable>
        </DragDropContext>
        <TextInput
            label="Entry Display Name" mt="xs" disabled={!form.values.primary}
            description="Displayed on each result row to identify each entry."
            leftSection={<IconTable size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder={`{{${form.values.primary?`${form.values.primary}.`:''}${form.values.primaryKey ? form.values.primaryKey :  (primaryHeaders[0] ? primaryHeaders[0] : 'id')}}}`}
            {...templateProps(form, 'display', { disabled: !form.values.primary } )}
        />
        <Switch label="Rule Enabled" description="Enables execution through scheduling" mt="xs" {...form.getInputProps('enabled', { type: 'checkbox' })} />
        <Switch label="Logging Enabled" description="Records execution results accessible via the log browser" mt="xs" {...form.getInputProps('log', { type: 'checkbox' })} />
        <Textarea
            label="Rule Description"
            placeholder="Describe what this rule does. Displayed on the rules overview page."
            mt="xs"
            {...form.getInputProps('description')}
        />
    </Box>)
}
