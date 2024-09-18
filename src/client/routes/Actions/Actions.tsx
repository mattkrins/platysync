import { Container, Group, Title, Paper, Grid, Text, Button, useMantineTheme, Loader, Popover, Box, Collapse, UnstyledButton } from "@mantine/core";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { ForwardRefExoticComponent, RefAttributes, useState } from "react";
import Wrapper from "../../components/Wrapper";
import { useDispatch, useLoader, useSelector, useSettings } from "../../hooks/redux";
import { getActions, getRules, loadActions, reorder } from "../../providers/schemaSlice";
import Editor from "./Editor";
import { Icon, IconChevronRight, IconCopy, IconGripVertical, IconPencil, IconPlus, IconProps, IconTrash } from "@tabler/icons-react";
import useAPI from "../../hooks/useAPI";
import MenuTip from "../../components/MenuTip";
import { availableAction, availableActions, availableCategories, availableCategory } from "../../modules/actions";
import { useClickOutside, useDisclosure } from "@mantine/hooks";
import classes from './Editor.module.css';
import { modals } from "@mantine/modals";

function useDependencyWalker(name: string) {
    const rules = useSelector(getRules);
    return () => {
        for (const rule of rules||[]) {
            for (const action of rule.initActions||[]) {
                if (action.config === name) return `rule '${rule.name}', action '${action.name}'`;
            }
            for (const action of rule.iterativeActions||[]) {
                if (action.config === name) return `rule '${rule.name}', action '${action.name}'`;
            }
            for (const action of rule.finalActions||[]) {
                if (action.config === name) return `rule '${rule.name}', action '${action.name}'`;
            }
        }
    }
}

function Action({ index, action: { name, id }, edit, refresh }: { index: number, action: ActionConfig, edit(): void, refresh(): void }) {
    const theme = useMantineTheme();
    const loaders = useLoader();
    const loading = loaders[`loadingactions_${index}`];
    const { del, loading: deleting, error: dError, reset: dReset } = useAPI({
        url: `/action`, data: { name }, schema: true,
        then: () => refresh()
    });
    const { put: copy, loading: copying, error: cError, reset: cReset } = useAPI({
        url: `/action/${name}/copy`, schema: true,
        then: () => refresh(),
    });
    const walk = useDependencyWalker(name);
    const clickDel = () => {
        const dependencies = walk();
        modals.openConfirmModal({
            title: dependencies ? 'Delete In-Use Config' : 'Delete Action Config',
            children:
            <Box>
                {dependencies&&<Text fw="bold" c="red" size="xs" mb="xs" >Warning, usage detected in {dependencies}.</Text>}
                <Text size="sm">Are you sure you want to delete <b>{name}</b>?<br/>This action is destructive and cannot be reversed.</Text>
            </Box>,
            labels: { confirm: 'Delete action config', cancel: "Cancel" },
            confirmProps: { color: 'red' },
            onConfirm: async () => await del(),
        }); 
    }

    const action = availableActions.find(a=>a.name===id);
    if (!action) return <MenuTip label="Delete" Icon={IconTrash} error={dError} reset={dReset} onClick={async () => await del()} loading={deleting} color="red" variant="subtle" />;
    const { Icon, color, label } = action;
    return (
    <Draggable index={index} draggableId={name}>
    {(provided, snapshot) => (
    <Paper mb="xs" p="xs" withBorder  {...provided.draggableProps} ref={provided.innerRef} >
        <Grid justify="space-between"  align="center" >
            <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                <Group justify="space-between">
                    <IconGripVertical size="1.2rem" />
                    <Group visibleFrom="xl" ><Icon size={20} color={color?theme.colors[color][6]:undefined} /></Group>
                </Group>
            </Grid.Col>
            <Grid.Col span={4}><Text truncate="end">{name}</Text></Grid.Col>
            <Grid.Col span={4}>{label}</Grid.Col>
            <Grid.Col span={3} miw={120}>
                    <Group gap="xs" justify="flex-end">
                        {loading&&<Loader size="xs" />}
                        <MenuTip label="Copy" Icon={IconCopy} error={cError} reset={cReset} onClick={()=>copy()} loading={copying} color="indigo" variant="subtle" />
                        <MenuTip label="Edit" Icon={IconPencil} onClick={edit} color="orange" variant="subtle" />
                        <MenuTip label="Delete" Icon={IconTrash} error={dError} reset={dReset} onClick={clickDel} loading={deleting} color="red" variant="subtle" />
                    </Group>
            </Grid.Col>
        </Grid>
    </Paper>
    )}
    </Draggable>)
}

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
    const filtered = availableActions.
    filter(a=> a.name==="SysRunCommand"?settings.enableRun:true ).
    filter(a=>a.category===category.id).
    filter(a=>!a.noPreConfig).
    filter(a=>a.Options);
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

function AddButton({ add }: { add(c: availableAction): void }) {
    const [opened, { open, close }] = useDisclosure(false);
    const ref = useClickOutside(() => close());
    const addClose = (c: availableAction) => { add(c); close(); }
    return (
    <Popover opened={opened} width={300} position="left-start" shadow="md" clickOutsideEvents={['mouseup', 'touchend']}>
        <Popover.Target>
            <Button onClick={open} leftSection={<IconPlus size={18} />}>Add</Button>
        </Popover.Target>
        <Popover.Dropdown ref={ref} >
            {availableCategories.map(category=><Category key={category.name} category={category} add={addClose} />)}
        </Popover.Dropdown>
    </Popover>
    );
}

export default function Actions() {
    const { loadingFiles } = useLoader();
    const dispatch = useDispatch();
    const actions = useSelector(getActions);
    const [ editing, setEditing ] = useState<[ActionConfig,boolean]|undefined>(undefined);
    const close = () => setEditing(undefined);
    const add = (c: availableAction) => setEditing([{ name: "", id: c.name, config: { name: c.name, ...c.initialValues } },false]);
    const refresh = () => dispatch(loadActions());
    return (
    <Container>
        <Editor editing={editing} close={close} refresh={refresh} />
        <Group justify="space-between">
            <Title mb="xs" >Actions</Title>
            <AddButton add={add} />
        </Group>
        <Wrapper loading={loadingFiles} >
            {(actions||[]).length<=0?<Text c="dimmed" >No actions configured. Add pre-configurations to pre-fill actions in rules.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={1}/>
                    <Grid.Col span={4}>Name</Grid.Col>
                    <Grid.Col span={4}>Action</Grid.Col>
                    <Grid.Col span={3}/>
                </Grid>
            </Paper>}
            <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "actions", from: source.index, to: destination?.index || 0 })) } >
            <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {(actions||[]).map((action, index) => <Action index={index} key={action.name} action={action} edit={()=>setEditing([{...action},true])} refresh={refresh} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Wrapper>
    </Container>
    )
}

