import { ActionIcon, Box, Grid, Group, Select, TextInput, Text, Switch, Textarea, Modal } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconCode, IconGripVertical, IconKey, IconPlus, IconSettings, IconTable, IconTag, IconTrash } from "@tabler/icons-react";
import SelectConnector from "../../Common/SelectConnector";
import { useContext, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import SchemaContext from "../../../providers/SchemaContext";
import ExplorerContext from "../../../providers/ExplorerContext";

interface Secondary {
    primary: string;
    secondaryKey: string;
    primaryKey: string;
}
function SecondaryConfig( { secondary, config, form }: { secondary?: Secondary, config: ()=>void, form: UseFormReturnType<Rule> } ) {
    const index = form.values.secondaries.findIndex(s =>s.primary ===secondary?.primary);
    return (
      <Modal opened={!!secondary} onClose={config} title={`Configure ${secondary?.primary} `}>
        {secondary&&<Box>
            <Switch label="Case Insensitive" mb="xs"
            {...form.getInputProps(`secondaries.${index}.case`, { type: 'checkbox' })} 
            />
            <Switch label="Required" mb={4} description={`Skip entries if no join found in '${secondary.primary}'.`}
            {...form.getInputProps(`secondaries.${index}.req`, { type: 'checkbox' })}
            />
            <Switch label="One-To-One" description={`Skip entries on multiple join potentials in '${secondary.primary}' found.`}
            {...form.getInputProps(`secondaries.${index}.oto`, { type: 'checkbox' })}
            />
        </Box>}
      </Modal>
    )
}

export default function Settings( { form, sources, taken }: {form: UseFormReturnType<Rule>, sources: string[], taken: string[]} ) {
    const { connectors } = useContext(SchemaContext);
    const { explorer, explore } = useContext(ExplorerContext);
    const [secondary, config] = useState<Secondary|undefined>(undefined);
    const usable = connectors.filter(c=>c.id!=="proxy").length -1 ;
    const { headers } = useContext(SchemaContext);
    const add = () => form.insertListItem('secondaries', { primary: '', secondaryKey: '', primaryKey: '' } as Secondary);
    const remove  = (index: number) => form.removeListItem('secondaries', index);
    const modify = () => (value: string) => form.setFieldValue('display', `${form.values.display||''}{{${value}}}`);
    return (
    <Box>
        <SecondaryConfig secondary={secondary} config={()=>config(undefined)} form={form} />
        {explorer}
        <TextInput
            label="Rule Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="Rule Name"
            withAsterisk mb="xs"
            {...form.getInputProps('name')}
        />
        <Grid>
            <Grid.Col span={8}>
                <SelectConnector
                label="Primary Data Source" withAsterisk
                description="Rule conditions will be evaluated for each entry in this connector. For each row, each user, etc."
                clearable
                {...form.getInputProps('primary')}
                disabled={(form.values.secondaries||[]).length>0}
                filter={data=>data.filter(c=>c.id!=="proxy")  }
                />
            </Grid.Col>
            <Grid.Col span={4}>
                <Select
                label="Primary Key" withAsterisk
                description="Unique identifier for each row."
                placeholder={"id"}
                data={ (form.values.primary in headers) ? headers[form.values.primary] : [] }
                disabled={!form.values.primary} clearable
                searchable leftSection={<IconKey size="1rem" />}
                {...form.getInputProps('primaryKey')}
                />
            </Grid.Col>
        </Grid>
        <Group grow justify="apart" mb="xs" gap="xs">
            <Text size="sm">Secondary Data Sources</Text>
            <Group justify="right" gap="xs" pt="xs" >
                <ActionIcon size="lg" variant="default" disabled={!form.values.primary||taken.length>=usable} onClick={add} ><IconPlus size={15} stroke={1.5} /></ActionIcon>
            </Group>
        </Group>
        <DragDropContext
        onDragEnd={({ destination, source }) => form.reorderListItem('secondaries', { from: source.index, to: destination? destination.index : 0 }) }
        >
        <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
            {(form.values.secondaries||[]).map((_, index)=>{
                const secondaryKey = () => (value: string) => form.setFieldValue(`secondaries.${index}.secondaryKey`, `{{${value}}}`);
                const primaryKey = () => (value: string) => form.setFieldValue(`secondaries.${index}.primaryKey`, `{{${value}}}`);
                const primary = form.values.secondaries[index].primary;
                return <Draggable key={index} index={index} draggableId={index.toString()}>
                    {(provided) => (
                    <Grid align="center" ref={provided.innerRef} mt="xs" {...provided.draggableProps} gutter="xs"
                    style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
                    >
                        <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                            <Group><IconGripVertical size="1.2rem" /></Group>
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <SelectConnector clearable disabled={!form.values.primary}
                            {...form.getInputProps(`secondaries.${index}.primary`)}
                            filter={data=>data.filter(c=>c.id!=="proxy"&&c.name!==form.values.primary&&!taken.includes(c.name))}
                            />
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <TextInput
                                leftSection={<IconKey size="1rem" />}
                                disabled={!form.values.primary}
                                placeholder={`{{${form.values.secondaries[index].primary}.${form.values.primaryKey}}}`}
                                rightSection={ <ActionIcon onClick={()=>explore(secondaryKey, [form.values.secondaries[index].primary])} variant="subtle" ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }} /></ActionIcon> }
                                {...form.getInputProps(`secondaries.${index}.secondaryKey`)}
                            />
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <TextInput
                                leftSection={<IconKey size="1rem" />}
                                disabled={!form.values.primary}
                                placeholder={`{{${form.values.primary}.${form.values.primaryKey}}}`}
                                rightSection={ <ActionIcon onClick={()=>explore(primaryKey, sources.filter((s,i)=>s!==primary&&i<=index))} variant="subtle" ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }} /></ActionIcon> }
                                {...form.getInputProps(`secondaries.${index}.primaryKey`)}
                            />
                        </Grid.Col>
                        <Grid.Col span="content">
                            <Group justify="right" gap="xs">
                                <ActionIcon color='red' onClick={()=>config(form.values.secondaries[index])} variant="default" size="lg"><IconSettings size={15}/></ActionIcon>
                                <ActionIcon color='red' onClick={()=>remove(index)} variant="default" size="lg"><IconTrash size={15}/></ActionIcon>
                            </Group>
                        </Grid.Col>
                    </Grid>)}
                </Draggable>}
                )
            }
            </div>
            )}
        </Droppable>
        </DragDropContext>
        <TextInput
            label="Entry Display Name"
            description="Displayed on each result row to identify each entry."
            leftSection={<IconTable size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="{{username}}"
            mt="xs"
            mb="xs"
            rightSection={ <ActionIcon onClick={()=>explore(modify, sources)} variant="subtle" ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }} /></ActionIcon> }
            {...form.getInputProps('display')}
        />
        <Switch {...form.getInputProps('enabled', { type: 'checkbox' })} label="Rule Enabled"/>
        <Textarea
            label="Rule Description"
            placeholder="Describe what this rule does"
            mt="xs"
            {...form.getInputProps('description')}
        />
    </Box>
    )
}
