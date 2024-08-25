import { ActionIcon, Anchor, Box, Button, Collapse, Divider, Grid, Group, Indicator, Menu, Paper, Popover, Text, TextInput, Tooltip, UnstyledButton, useMantineTheme } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useClickOutside, useDisclosure } from "@mantine/hooks";
import classes from './Actions.module.css';
import { IconProps, Icon, IconChevronRight, IconChevronDown, IconGripVertical, IconTrash, IconCopy, IconPencil, IconX, IconFolderSearch, IconEraser, IconSettings2, IconCheck, IconExclamationCircle } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes, useMemo } from "react";
import { availableAction, availableActions, availableCategories, availableCategory } from "../../../modules/actions";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import MenuTip from "../../../components/MenuTip";
import { useRule } from "./Editor";
import useTemplater, { TemplateOptions } from "../../../hooks/useTemplater";
import { useSelector, useSettings } from "../../../hooks/redux";
import { getActions } from "../../../providers/schemaSlice";
import SelectActionConnector from "../../../components/SelectActionConnector";

interface SectionProps {
    onClick(): void;
    open?: boolean;
    label: string;
    color?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    Ricon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
}
function Section({ onClick, open, label, color, Icon, Ricon }: SectionProps ) {
    return (
    <UnstyledButton onClick={onClick} className={classes.connector} p="xs" mt={0} >
        <Group>
            <Box style={{ display: 'flex', alignItems: 'center' }} >
                <Icon size={17} color={color||"grey"} />
            </Box>
            <div style={{ flex: 1 }}><Text size="sm">{label}</Text></div>
            {open!==undefined&&<IconChevronRight size={17} stroke={1.5} style={{transform: open ? `rotate(${90}deg)` : 'none',}} />}
            {Ricon&&<Ricon size={17} stroke={1.5}/>}
        </Group>
    </UnstyledButton>
    )
}

function Category({ category, add, form, type }: { category: availableCategory, add(c: availableAction): void, form: UseFormReturnType<Rule>, type: string }) {
    const theme = useMantineTheme();
    const [opened, { toggle }] = useDisclosure(false);
    const { ruleProConnectors } = useRule(form);
    const settings = useSettings(); 
    const filtered = useMemo(()=>availableActions.
    filter(a=> a.name==="SysRunCommand"?settings.enableRun:true ).
    filter(a=> a.iterative?( typeof(a.iterative)==="boolean" ? (type==="iterativeActions") : true ) : true ).
    filter(a=>a.category===category.id).
    filter(a=>a.provider?ruleProConnectors.
    find(c=>c.id===a.provider):true)
    , [ ruleProConnectors, settings, type ]);
    return (
    <>
        <Section open={opened} label={category.name} Icon={category.Icon} onClick={toggle} color={category.color?theme.colors[category.color][6]:undefined} />
        <Collapse in={opened} >
            {filtered.map(action=>
            <UnstyledButton onClick={()=>add(action)} p="xs" pt={5} pb={5} pl="md" key={action.name} className={classes.connector}>
                <Group>
                    <Box style={{ display: 'flex', alignItems: 'center' }} >
                        <action.Icon size={17} color={action.color?theme.colors[action.color][6]:undefined} />
                    </Box>
                    <div style={{ flex: 1 }}><Text size="sm">{action.label||action.name}</Text></div>
                </Group>
            </UnstyledButton>)}
        </Collapse>
    </>
    );
}

function ActionButton({ label, add, type, form, disabled }: { label: string, type: string, add(c: availableAction, type: string): void, form: UseFormReturnType<Rule>, disabled?: boolean }) {
    const [opened, { open, close }] = useDisclosure(false);
    const ref = useClickOutside(() => close());
    const addClose = (c: availableAction) => { add(c, type); close(); }
    const { ruleProConnectors } = useRule(form);
    const filtered = useMemo(()=>availableCategories.
    filter(a=>a.provider?ruleProConnectors.
    find(c=>c.id===a.provider):true)
    , [ ruleProConnectors ]);
    return (
    <Popover opened={opened} width={300} position="left-start" shadow="md" clickOutsideEvents={['mouseup', 'touchend']}>
        <Popover.Target>
            <Button disabled={disabled} size="sm" onClick={open} rightSection={<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12}>{label}</Button>
        </Popover.Target>
        <Popover.Dropdown ref={ref} >
            {filtered.map(category=><Category key={category.name} type={type} category={category} add={addClose} form={form} />)}
        </Popover.Dropdown>
    </Popover>
    );
}

function SelectConfig({ id, onClick, active }: { id: string, onClick(name?: string): void, active?: string }) {
    const actions = useSelector(getActions);
    const filtered = actions.filter(a=>a.id===id);
    return (
    <Menu shadow="md" position="left" width={200} >
        <Menu.Target>
            <Tooltip label={active?`Using Config '${active}'`:"Select Config"} color="green" >
                <ActionIcon disabled={filtered.length<=0} color="green" variant={active?"light":"subtle"} >
                    <IconSettings2 size={16} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>
            {filtered.map(a=>
            <Menu.Item key={a.name}
            leftSection={active===a.name?<IconCheck size={14} stroke={1.5} />:undefined}
            onClick={()=>active===a.name?onClick(undefined):onClick(a.name)} >
            {a.name}
            </Menu.Item>)}
        </Menu.Dropdown>
    </Menu>
    )
}

function Action({ index, action, type, form }: { index: number, action: Action, form: UseFormReturnType<Rule>, type: string }) {
    const [opened, { toggle: t1 }] = useDisclosure(false);
    const [render, { close, open }] = useDisclosure(false);
    const toggle = () => {
        if (render && !opened) return;
        t1();
        if (opened) return setTimeout(close, 400);
        open();
    }
    const theme = useMantineTheme();
    const remove = () => form.removeListItem(type, index);
    const copy = () => form.insertListItem(type, structuredClone(form.values[type as "initActions"][index]), index+1);
    const display = form.values[type as "initActions"][index].display;
    const config = form.values[type as "initActions"][index].config;
    const setConfig = (name: string) => form.setFieldValue(`${type}.${index}.config`, name);
    const { templateSources, inline, sources } = useRule(form, type);
    const iterative = type === "iterativeActions";
    const actionConfig = availableActions.find(a=>a.name===action.name) as availableAction;
    const { templateProps, explorer } = useTemplater({names:iterative?templateSources:[], inline});
    if (!actionConfig) return <MenuTip label="Delete" Icon={IconTrash} onClick={remove} color="red" variant="subtle" />;
    const { Icon, color, name, label, validator, overwriter, Options, provider, iterative: Context } = actionConfig;
    const useContext = !iterative && Context && (typeof Context === "function");
    const actions = useSelector(getActions);
    const configProps = useMemo(()=>{
        if (!config) return templateProps;
        return (form: UseFormReturnType<any>, path: string, options: TemplateOptions = {}) => {
            const props = templateProps(form, path, options);
            const action = actions.find(f=>f.name===config);
            if (!action) return props;
            const name = path.split(".").at(-1) as string;
            if (!action.config[name]) return props;
            const props2 = templateProps(form, path, {...options, value: String(action.config[name]) });
            const styles = props2.error ? undefined : { input: { borderColor: theme.colors[form.getInputProps(path).value ? "violet" : "green"][9] } };
            const placeholder = typeof action.config[name] === "string" ? action.config[name] : options.placeholder;
            return {...props2, styles, placeholder, withAsterisk: false };
        }
    },[ config, actions, templateProps ]);
    return <>{explorer}
    <Draggable key={`${type}${index}`} index={index} draggableId={`${type}${index}`}>
    {(provided) => (
        //TODO - add validate button
        //TODO - indicate when validation not satisfied
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
                <TextInput variant="filled" {...form.getInputProps(`${type}.${index}.display`)}
                value={display?display:(label||name)}
                />
            </Grid.Col>
            {provider&&<Grid.Col span={5}>
                <Divider orientation="vertical" />
                <SelectActionConnector {...form.getInputProps(`${`${type}.${index}`}.connector`)}
                form={form} path={`${`${type}.${index}`}.connector`} width={'auto'} position="bottom-start"
                ids={provider?[provider]:undefined} names={sources} variant="unstyled"
                />
                <Divider orientation="vertical" />
            </Grid.Col>}
            <Grid.Col span="auto" miw={120}>
                <Group gap="xs" justify="flex-end">
                    {config&&<Text size="xs" c="dimmed">{config}</Text>}
                    <SelectConfig id={name} onClick={setConfig} active={config} />
                    {overwriter&&<MenuTip label="Should Overwrite" Icon={IconEraser} color="grape" variant={action.overwrite?"light":"subtle"}
                    onClick={()=>form.setFieldValue(`${type}.${index}.overwrite`, !action.overwrite)} />}
                    {validator&&<MenuTip label="Validate Paths" Icon={IconFolderSearch} color="lime" variant={action.validate?"light":"subtle"}
                    onClick={()=>form.setFieldValue(`${type}.${index}.validate`, !action.validate)} />}
                    <MenuTip label="Continue On Error" Icon={IconExclamationCircle} color="orange" variant={action.noblock?"light":"subtle"}
                    onClick={()=>form.setFieldValue(`${type}.${index}.noblock`, !action.noblock)} />
                    <MenuTip label="Disable" Icon={IconX} color="pink" variant={!action.enabled?"light":"subtle"}
                    onClick={()=>form.setFieldValue(`${type}.${index}.enabled`, !action.enabled)} />
                    <Divider orientation="vertical" />
                    {(Options||useContext)&&<MenuTip label="Edit" Icon={IconPencil} onClick={toggle} color="orange" variant={opened?"default":"subtle"} />}
                    <MenuTip label="Copy" Icon={IconCopy} onClick={copy} color="indigo" variant="subtle" />
                    <MenuTip label="Delete" Icon={IconTrash} onClick={remove} color="red" variant="subtle" />
                </Group>
            </Grid.Col>
        </Grid>
        <Collapse in={opened} >
            {render&&<>
            <Divider mb="xs" mt={4} />
            { useContext && <Box p="xs" pt={0} pb={0} >
                <Context form={form} sources={templateSources} rule={form} path={`${type}.${index}`}  />
            </Box>}
            <Box p="xs" pt={0} >
                {Options&&<Options form={form} path={`${type}.${index}`} configured={config} templateProps={configProps} iterative={iterative} />}
            </Box>
            </>}
        </Collapse>
    </Paper></Indicator>)}
    </Draggable></>
}

export default function Actions({ form, setActiveTab }: { form: UseFormReturnType<Rule>, setActiveTab(t: string): void }) {
    const add = (c: availableAction, type: string) => form.insertListItem(type, { name: c.name, enabled: true, ...c.initialValues });
    return (
    <Box>
        <Divider my="xs" label={<ActionButton add={add} type="initActions" label="Initial Action" form={form} />} labelPosition="right" />
        {form.values.initActions.length<=0&&<Text size="xs" c="dimmed" >Initial actions are executed at the begining of rules unconditionally.</Text>}
        <DragDropContext onDragEnd={(result) => {
            const { destination, source } = result;
            if (!destination) return;
            if (destination.droppableId === source.droppableId) {
                if (source.index === destination.index) return;
                return form.reorderListItem(destination.droppableId, { from: source.index, to: destination? destination.index : 0 })
            }
            const clone = structuredClone(form.values[source.droppableId as "initActions"][source.index]);
            form.removeListItem(source.droppableId, source.index);
            form.insertListItem(destination.droppableId, clone, destination.index);
        } } >
            <Droppable droppableId="initActions" direction="vertical" type="action" >
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                {(form.values.initActions||[]).map((action, index)=>
                <Action key={`init${index}`} type="initActions" index={index} action={action} form={form} />)}
                {provided.placeholder}
            </div>
            )}
            </Droppable>
            <Divider my="xs" label={<ActionButton add={add} type="iterativeActions" label="Iterative Action" form={form} disabled={!form.values.primary} />} labelPosition="right" />
            {!form.values.primary ? <Text size="xs" c="dimmed" >Select a <Anchor onClick={()=>setActiveTab("settings")} >primary data source</Anchor> to execute iterative actions for each row, entry, user, etc.</Text>:
            form.values.iterativeActions.length<=0&&
            <Text size="xs" c="dimmed" >Iterative actions are executed for each row, entry, user, etc.
            {form.values.conditions.length>0&&<> if they pass {form.values.conditions.length} <Anchor onClick={()=>setActiveTab("conditions")} >conditional</Anchor> checks.</>}</Text>}
            <Droppable droppableId="iterativeActions" direction="vertical" type="iterative" >
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                {form.values.iterativeActions.map((action, index)=>
                <Action key={`iterative${index}`} type="iterativeActions" index={index} action={action} form={form} />)}
                {provided.placeholder}
            </div>
            )}
            </Droppable>
            <Divider my="xs" label={<ActionButton add={add} type="finalActions" label="Final Action" form={form} />} labelPosition="right" />
            {form.values.finalActions.length<=0&&<Text size="xs" c="dimmed" >Final actions are executed at the end of rules if all iterative actions succeeded.</Text>}
            <Droppable droppableId="finalActions" direction="vertical" type="action" >
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                {(form.values.finalActions||[]).map((action, index)=>
                <Action key={`final${index}`} type="finalActions" index={index} action={action} form={form} />)}
                {provided.placeholder}
            </div>
            )}
            </Droppable>
        </DragDropContext>
    </Box>)
}
