import { Divider, Grid, Group, Indicator, Paper, TextInput, Tooltip, useMantineTheme, Collapse, Box, Menu, ActionIcon } from "@mantine/core";
import { IconCheck, IconCopy, IconEraser, IconExclamationCircle, IconFolderSearch, IconGripVertical, IconPencil, IconTemplate, IconTrash, IconX } from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { Draggable } from "@hello-pangea/dnd";
import MenuTip from "../../../../components/MenuTip";
import { availableOperations, operationProp } from "./operations";
import { getBlueprints } from "../../../../providers/schemaSlice";
import { useSelector } from "../../../../hooks/redux";
import { useMemo } from "react";

function BlueprintSelector({ id, active, onClick }: { id: string, active?: string, onClick(b?: string): void }) {
    const blueprints = useSelector(getBlueprints);
    const filtered = blueprints.filter(b=>b.id===id);
    return (
    <Menu shadow="md" position="left" width={200} >
        <Menu.Target>
            <Tooltip label={active?`Using Blueprint '${active}'`:"Select Blueprint"} color="blue" >
                <ActionIcon disabled={filtered.length<=0} color="blue" variant={active?"light":"subtle"} >
                    <IconTemplate size={16} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>
            <Menu.Label>{id} blueprints:</Menu.Label>
            {filtered.map(a=>
            <Menu.Item key={a.name}
            leftSection={active===a.name?<IconCheck size={14} stroke={1.5} />:undefined}
            onClick={()=>active===a.name?onClick(undefined):onClick(a.name)}
            >{a.name}
            </Menu.Item>)}
        </Menu.Dropdown>
    </Menu>
    )
}

export default function Action({ index, action, type, form }: { index: number, action: Action, form: UseFormReturnType<Rule>, type: string }) {
    const [opened, { toggle: t1 }] = useDisclosure(false);
    const [render, { close, open }] = useDisclosure(false);
    const blueprints = useSelector(getBlueprints);
    const toggle = () => {
        if (render && !opened) return;
        t1();
        if (opened) return setTimeout(close, 400);
        open();
    }
    const theme = useMantineTheme();
    const remove = () => form.removeListItem(type, index);
    const copy = () => form.insertListItem(type, structuredClone(form.values[type as "initActions"][index]), index+1);
    const operation = availableOperations.find(a=>a.name===action.id);
    if (!operation) return <MenuTip label="Delete" Icon={IconTrash} onClick={remove} color="red" variant="subtle" />;
    const { Icon, color, name, label, validator, overwriter, Operation } = operation;
    const display = form.values[type as "initActions"][index].name;
    const blueprint = useMemo(()=>blueprints.find(b=>b.name===action.blueprint),[ action.blueprint, blueprints ]);
    const props = (name: string, options?: { type?: any }) => {
        const props: operationProp = {...form.getInputProps(name, options)};
        if (options?.type === "password") {
            props.secure = !!props.value && typeof props.value !== 'string';
            props.unlock = () => form.setFieldValue(name, "");
        }
        if (blueprint&& blueprint[name] ){ //TODO - find a way to show preconfig on non-input fields.
            props.placeholder = String(blueprint[name]);
            const modified = props.value && props.value !== blueprint[name];
            const color = theme.colors[ modified ? 'cyan' : 'blue'][9];
            props.styles = { input: { borderColor: color } };
            props.leftSection = <IconTemplate size={16} style={{ display: 'block', opacity: 0.8 }} color={color} />
        }
        return props;
    }
    const setBlueprint = (b?: string) => form.setFieldValue(`${type}.${index}.blueprint`, b)
    return (
        <Draggable key={`${type}${index}`} index={index} draggableId={`${type}${index}`}>
            {(provided) => (
            <Indicator disabled={!!action.enabled&&!action.noblock} color={!action.enabled?"red":"orange"}  {...provided.draggableProps} ref={provided.innerRef} >
                <Paper mb="xs" p={4} withBorder>
                    <Grid columns={20} justify="space-between"  align="center" >
                        <Grid.Col span={2} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                            <Group justify="space-between" gap={0}  >
                                <IconGripVertical size="1.2rem" />
                                <Group visibleFrom="xl" >{(index+1).toString()}.</Group>
                                <Group visibleFrom="xl" >
                                    <Tooltip label={label} color={color?theme.colors[color][6]:undefined} >
                                        <Icon size={20} color={color?theme.colors[color][6]:undefined} />
                                    </Tooltip>
                                </Group>
                            </Group>
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <TextInput variant="filled" {...form.getInputProps(`${type}.${index}.name`)}
                            value={display?display:(label||name)}
                            />
                        </Grid.Col>
                        <Grid.Col span="auto" miw={120}>
                            <Group gap="xs" justify="flex-end">
                                {Operation&&<BlueprintSelector active={action.blueprint} id={operation.name} onClick={setBlueprint} />}
                                {overwriter&&<MenuTip label="Should Overwrite" Icon={IconEraser} color="grape" variant={action.overwrite?"light":"subtle"}
                                onClick={()=>form.setFieldValue(`${type}.${index}.overwrite`, !action.overwrite)} />}
                                {validator&&<MenuTip label="Validate Paths" Icon={IconFolderSearch} color="lime" variant={action.validate?"light":"subtle"}
                                onClick={()=>form.setFieldValue(`${type}.${index}.validate`, !action.validate)} />}
                                <MenuTip label="Continue On Error" Icon={IconExclamationCircle} color="orange" variant={action.noblock?"light":"subtle"}
                                onClick={()=>form.setFieldValue(`${type}.${index}.noblock`, !action.noblock)} />
                                <MenuTip label="Disable" Icon={IconX} color="pink" variant={!action.enabled?"light":"subtle"}
                                onClick={()=>form.setFieldValue(`${type}.${index}.enabled`, !action.enabled)} />
                                <Divider orientation="vertical" />
                                {(Operation)&&<MenuTip label="Edit" Icon={IconPencil} onClick={toggle} color="orange" variant={opened?"default":"subtle"} />}
                                <MenuTip label="Copy" Icon={IconCopy} onClick={copy} color="indigo" variant="subtle" />
                                <MenuTip label="Delete" Icon={IconTrash} onClick={remove} color="red" variant="subtle" />
                            </Group>
                        </Grid.Col>
                    </Grid>{Operation&&
                    <Collapse in={opened} >
                        {render&&<>
                        <Divider mb="xs" mt={4} />
                        <Box p="xs" pt={0} >
                            <Operation props={props} blueprint={blueprint} rule={form.values} />
                        </Box>
                        </>}
                    </Collapse>}
                </Paper>
            </Indicator>)}
        </Draggable>
    )
}
