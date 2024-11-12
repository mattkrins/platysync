import { Anchor, Box, Button, Collapse, Divider, Group, Popover, Text, UnstyledButton, useMantineTheme } from "@mantine/core";
import { Icon, IconChevronDown, IconChevronRight, IconProps } from "@tabler/icons-react";
import { availableAction, availableActions, availableCategories, availableCategory } from "../../../../modules/actions";
import { editorTab } from "./Editor";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useClickOutside, useDisclosure } from "@mantine/hooks";
import { UseFormReturnType } from "@mantine/form";
import { ForwardRefExoticComponent, RefAttributes, useMemo } from "react";
import useRule from "../../../../hooks/useRule";
import { useSettings } from "../../../../hooks/redux";
import classes from './Actions.module.css';
import Action from "./Action";

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
    const settings = useSettings();
    const filteredActions = useMemo(()=>availableActions.
    filter(a=> a.name==="SysRunCommand"?settings.enableRun:true ).
    filter(a=>a.category===category.id)
    , [ settings.enableRun ]);
    return (
    <>
        <Section open={opened} label={category.name} Icon={category.Icon} onClick={toggle} color={category.color?theme.colors[category.color][6]:undefined} />
        <Collapse in={opened} >
            {filteredActions.map(action=>
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
    const { sourceProConnectors } = useRule(form.values);
    const filteredCategories = useMemo(()=>{
        const ruleTypes = sourceProConnectors.map(c=>c.id);
        return availableCategories.filter(c=>c.provider?ruleTypes.includes(c.provider):true);
    }, [ sourceProConnectors ]);
    return (
    <Popover opened={opened} width={300} position="left-start" shadow="md" clickOutsideEvents={['mouseup', 'touchend']}>
        <Popover.Target>
            <Button disabled={disabled} size="sm" onClick={open} rightSection={<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12}>{label}</Button>
        </Popover.Target>
        <Popover.Dropdown ref={ref} >
            {filteredCategories.map(category=><Category key={category.name} category={category} add={addClose} />)}
        </Popover.Dropdown>
    </Popover>
    );
}

export default function Actions({ form, setTab }: editorTab) {
    const add = (c: availableAction, type: string) => form.insertListItem(type, { name: c.name, enabled: true, ...c.initialValues });
  return (
    <Box>
        <Divider my="xs" label={<ActionButton add={add} type="initActions" label="Initial Action" form={form} />} labelPosition="right" />
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
            {form.values.initActions.length<=0&&<Text size="xs" c="dimmed" >Initial actions are executed at the begining of rules unconditionally.</Text>}
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
            {!form.values.primary ? <Text size="xs" c="dimmed" >Select a <Anchor onClick={()=>setTab("settings")} >primary data source</Anchor> to execute iterative actions for each row, entry, user, etc.</Text>:
            form.values.iterativeActions.length<=0&&
            <Text size="xs" c="dimmed" >Iterative actions are executed for each row, entry, user, etc.
            {form.values.conditions.length>0&&<> if they pass {form.values.conditions.length} <Anchor onClick={()=>setTab("conditions")} >conditional</Anchor> checks.</>}</Text>}
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
    </Box>
  )
}
