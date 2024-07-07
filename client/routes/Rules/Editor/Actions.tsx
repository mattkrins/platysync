import { Anchor, Box, Button, Collapse, Divider, Grid, Group, Paper, Popover, Text, TextInput, UnstyledButton, useMantineTheme } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useClickOutside, useDisclosure } from "@mantine/hooks";
import classes from './Actions.module.css';
import { IconProps, Icon, IconChevronRight, IconChevronDown, IconGripVertical, IconTrash, IconCopy, IconPencil } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { availableAction, availableActions, availableCategories, availableCategory } from "../../../modules/actions";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import MenuTip from "../../../components/MenuTip";
//LINK - https://github.com/hello-pangea/dnd/blob/main/docs/api/droppable.md#conditionally-dropping

//NOTE - do not make target connector avalible if only 1 of type in context
//NOTE - unlock context, enable selecting any connector but additional field target user appears with filter
//NOTE - on server-side, if no target specified, use user in context

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

function Category({ category, add }: { category: availableCategory, add(c: availableAction): void }) {
    const theme = useMantineTheme();
    const [opened, { toggle }] = useDisclosure(false);
    return (
    <>
        <Section open={opened} label={category.name} Icon={category.Icon} onClick={toggle} color={category.color?theme.colors[category.color][6]:undefined} />
        <Collapse in={opened} >
            {availableActions.filter(a=>a.category===category.id).map(action=>
            <UnstyledButton onClick={()=>add(action)} p="xs" pt={5} pb={5} pl="md" key={action.name} className={classes.connector}>
                <Group>
                    <Box style={{ display: 'flex', alignItems: 'center' }} >
                        <action.Icon size={17} color={action.color?theme.colors[action.color][6]:undefined} />
                    </Box>
                    <div style={{ flex: 1 }}><Text size="sm">{action.name}</Text></div>
                </Group>
            </UnstyledButton>)}
        </Collapse>
    </>
    );
}

function ActionButton({ label, add, type }: { label: string, type: string, add(c: availableAction, type: string): void }) {
    const [opened, { open, close }] = useDisclosure(false);
    const ref = useClickOutside(() => close());
    const addClose = (c: availableAction) => { add(c, type); close(); }
    return (
    <Popover opened={opened} width={300} position="left-start" shadow="md" clickOutsideEvents={['mouseup', 'touchend']}>
        <Popover.Target>
            <Button size="sm" onClick={open} rightSection={<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12}>{label}</Button>
        </Popover.Target>
        <Popover.Dropdown ref={ref} >
            {availableCategories.map(category=><Category category={category} add={addClose} />)}
        </Popover.Dropdown>
    </Popover>
    );
}

function Action({ index, action, type, form }: { index: number, action: Action, form: UseFormReturnType<Rule>, type: string }) {
    const theme = useMantineTheme();
    const { Icon, color } = availableActions.find(a=>a.name===action.name) as availableAction;
    const remove = () => form.removeListItem(type, index);
    const copy = () => form.insertListItem(type, structuredClone(form.values[type as "initActions"][index]), index+1);
    const display = form.values[type as "initActions"][index].display;
    return <Draggable key={`${type}${index}`} index={index} draggableId={`${type}${index}`}>
    {(provided) => (
    <Paper mb="xs" p={4} withBorder  {...provided.draggableProps} ref={provided.innerRef} >
        <Grid columns={20} justify="space-between"  align="center" >
            <Grid.Col span={2} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                <Group justify="space-between">
                    <IconGripVertical size="1.2rem" />
                    <Group visibleFrom="xl" ><Icon size={20} color={color?theme.colors[color][6]:undefined} /></Group>
                    <Group visibleFrom="xl" >{(index+1).toString()}.</Group>
                </Group>
            </Grid.Col>
            <Grid.Col span={15}>
                <TextInput variant="filled" {...form.getInputProps(`${type}.${index}.display`)}
                value={display?display:action.name}
                />
            </Grid.Col>
            <Grid.Col span={2} miw={120}>
                    <Group gap="xs" justify="flex-end">
                        <MenuTip label="Edit" Icon={IconPencil} onClick={()=>{}} color="orange" variant="subtle" />
                        <MenuTip label="Copy" Icon={IconCopy} onClick={copy} color="indigo" variant="subtle" />
                        <MenuTip label="Delete" Icon={IconTrash} onClick={remove} color="red" variant="subtle" />
                    </Group>
            </Grid.Col>
        </Grid>
    </Paper>)}
    </Draggable>
}

export default function Actions({ form, setActiveTab }: { form: UseFormReturnType<Rule>, setActiveTab(t: string): void }) {
    const add = (c: availableAction, type: string) => form.insertListItem(type, { name: c.name });
    return (
    <Box>
        <Divider my="xs" label={<ActionButton add={add} type="initActions" label="Initial Action" />} labelPosition="right" />
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
            <Divider my="xs" label={<ActionButton add={add} type="iterativeActions" label="Iterative Action"/>} labelPosition="right" />
            {form.values.iterativeActions.length<=0&&
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
            <Divider my="xs" label={<ActionButton add={add} type="finalActions" label="Final Action"/>} labelPosition="right" />
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
