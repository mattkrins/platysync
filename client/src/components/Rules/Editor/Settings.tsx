import { ActionIcon, Box, Grid, Group, Select, TextInput, Text, Switch, Textarea, Menu, useMantineTheme, Divider } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconCode, IconGripVertical, IconKey, IconPlus, IconTable, IconTag, IconTrash } from "@tabler/icons-react";
import SelectConnector from "../../Common/SelectConnector";
import { useContext } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import SchemaContext from "../../../providers/SchemaContext";
import ExplorerContext from "../../../providers/ExplorerContext";
import useModal from "../../../hooks/useModal";
import providers from "../../../modules/connectors";

export default function Settings( { form }: {form: UseFormReturnType<Rule>} ) {
    const theme = useMantineTheme();
    const { connectors, _connectors } = useContext(SchemaContext);
    const { explorer, explore } = useContext(ExplorerContext);
    const usable = connectors.filter(c=>c.id!=="proxy").length -1 ;
    const { headers } = useContext(SchemaContext);
    const add_old = () => form.insertListItem('secondaries', { primary: '', secondaryKey: '', primaryKey: '' });
    const remove  = (index: number) => form.removeListItem('secondaries', index);
    const taken = (form.values.secondaries||[]).map(s=>s.primary);
    const modify = () => (value: string) => form.setFieldValue('display', `${form.values.display||''}{{${value}}}`)
    const { Modal } = useModal("Connector", true);
    
    const add = (name: string) => () => form.insertListItem('connectors', { name, key: '' });
    
    return (
    <Box>
        <Modal/>
        {explorer}
        <TextInput
            label="Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="Rule Name"
            withAsterisk mb="xs"
            {...form.getInputProps('name')}
        />
        <Group grow justify="apart" mb="xs" gap="xs">
            <Text size="sm">Connectors</Text>
            <Group justify="right" gap="xs" pt="xs" >
                <Menu position="bottom-end" >
                    <Menu.Target>
                        <ActionIcon size="lg" variant="default" ><IconPlus size={15} stroke={1.5} /></ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                    {connectors.map(c=>{
                        const provider = providers[c.id];
                        return <Menu.Item key={c.name} onClick={add(c.name)} leftSection={<provider.icon color={theme.colors[provider.color][6]} />} >{c.name}</Menu.Item>
                    })}
                    </Menu.Dropdown>
                </Menu>
            </Group>
        </Group>
        <DragDropContext
        onDragEnd={({ destination, source }) => form.reorderListItem('connectors', { from: source.index, to: destination? destination.index : 0 }) }
        >
        <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
            {(form.values.connectors||[]).map(({ name }, index)=> {
                const connector = _connectors[name];
                const provider = providers[connector.id];
                return <Draggable key={index} index={index} draggableId={index.toString()}>
                    {(provided) => (
                    <Grid align="center" ref={provided.innerRef} mt="xs" {...provided.draggableProps} gutter="xs"
                    style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
                    >
                        <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                            <Group><IconGripVertical size="1.2rem" /></Group>
                        </Grid.Col>
                        <Grid.Col span="content">
                            <Group><provider.icon color={theme.colors[provider.color][6]} /></Group>
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <Divider my="xs" label={name} labelPosition="left" />
                        </Grid.Col>
                        <Grid.Col span="content">
                            <Group justify="right" gap="xs">
                                <ActionIcon color='red' onClick={()=>form.removeListItem('connectors', index)} variant="default" size="lg"><IconTrash size={15}/></ActionIcon>
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


        <Grid>
            <Grid.Col span={8}>
                <SelectConnector
                label="Primary Data Source" withAsterisk
                description="Rule conditions will be evaluated for each entry in this connector. For each row, each user, etc."
                clearable
                {...form.getInputProps('primary')}
                filter={data=>data.filter(c=>c.id!=="proxy")}
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
                <ActionIcon size="lg" variant="default" disabled={!form.values.primary||taken.length>=usable} onClick={add_old} ><IconPlus size={15} stroke={1.5} /></ActionIcon>
            </Group>
        </Group>
        <DragDropContext
        onDragEnd={({ destination, source }) => form.reorderListItem('secondaries', { from: source.index, to: destination? destination.index : 0 }) }
        >
        <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
            {(form.values.secondaries||[]).map(({ primary }, index)=>
                <Draggable key={index} index={index} draggableId={index.toString()}>
                    {(provided) => (
                    <Grid align="center" ref={provided.innerRef} mt="xs" {...provided.draggableProps} gutter="xs"
                    style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
                    >
                        <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                            <Group><IconGripVertical size="1.2rem" /></Group>
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <SelectConnector clearable
                            {...form.getInputProps(`secondaries.${index}.primary`)}
                            filter={data=>data.filter(c=>c.id!=="proxy"&&c.name!==form.values.primary&&!taken.includes(c.name))}
                            />
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <Select clearable searchable
                            placeholder="Foreign Key"
                            leftSection={<IconKey size="1rem" />}
                            disabled={!primary}
                            data={ (primary in headers) ? headers[primary] : [] }
                            {...form.getInputProps(`secondaries.${index}.secondaryKey`)}
                            />
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <Select clearable searchable
                            placeholder="Primary Key"
                            leftSection={<IconKey size="1rem" />}
                            disabled={!primary}
                            data={ (form.values.primary in headers) ? headers[form.values.primary] : [] }
                            {...form.getInputProps(`secondaries.${index}.primaryKey`)}
                            />
                        </Grid.Col>
                        <Grid.Col span="content">
                            <Group justify="right" gap="xs">
                                <ActionIcon color='red' onClick={()=>remove(index)} variant="default" size="lg"><IconTrash size={15}/></ActionIcon>
                            </Group>
                        </Grid.Col>
                    </Grid>)}
                </Draggable>
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
            rightSection={ <ActionIcon onClick={()=>explore(modify)} variant="subtle" ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }} /></ActionIcon> }
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
