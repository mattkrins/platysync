import { Group, Title, Button, Anchor, Paper, Grid, Container, Text, Loader, useMantineTheme, Switch, Tooltip } from "@mantine/core";
import { IconCopy, IconGripVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import Wrapper from "../../components/Wrapper";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { getSchedules, loadSchedules, reorder } from "../../providers/schemaSlice";
import Editor, { triggerDetails } from "./Editor";
import useEditor from "../../hooks/useEditor";
import MenuTip from "../../components/MenuTip";
import useAPI from "../../hooks/useAPI";

function Schedule({ index, schedule: { name, enabled, triggers, tasks, description }, edit, refresh }: { index: number, schedule: Schedule, edit(): void, refresh(): Promise<void> }) {
    const theme = useMantineTheme();
    const loaders = useLoader();
    const loading = loaders[`loadingschedules_${index}`];
    const { del, loading: deleting, error: dError, reset: dReset } = useAPI({
        url: `/schedule`, data: { name }, schema: true,
        then: () => refresh()
    });
    const { put: copy, loading: copying, error: cError, reset: cReset } = useAPI({
        url: `/schedule/${name}/copy`, schema: true,
        then: () => refresh(),
    });
    const { data: success, put: toggle, loading: switching, error: sError, reset: sReset } = useAPI({
        url: `/schedule/${name}/${enabled?'disable':'enable'}`, schema: true,
        then: () => refresh().then(()=>sReset()),
    });
    const enabledTriggers = triggers.filter(t=>t.enabled);
    const triggerDetailsText = enabledTriggers.length <= 0 ? `${triggers.length} disabled triggers` :
    (enabledTriggers.length > 1 ?  `${triggers.length} triggers defined` : triggerDetails(enabledTriggers[0]));
    const enabledTasks = tasks.filter(t=>t.enabled);
    const taskDetails = enabledTasks.length <= 0 ? `${tasks.length} disabled tasks` :
    (enabledTasks.length > 1 ?  `${tasks.length} tasks defined` : ( (enabledTasks[0].rules||[]).length > 0 ? `${(enabledTasks[0].rules||[]).join(', ')}` : `[ All Rules ]` ) );
    const canEnable = enabledTriggers.length > 0 && enabledTasks.length > 0;
    return (
    <Draggable index={index} draggableId={name}>
    {(provided, snapshot) => (
    <Paper mb="xs" p="xs" withBorder  {...provided.draggableProps} ref={provided.innerRef} >
        <Grid justify="space-between"  align="center" >
            <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                <Group justify="space-between">
                    <IconGripVertical size="1.2rem" />
                </Group>
            </Grid.Col>
            <Grid.Col span={2}>
                <Tooltip disabled={!description} label={<><Text size="xs" >{description}</Text></>} position="bottom-start" withArrow  color="gray">
                    <Text truncate="end">{name}</Text>
                </Tooltip>
            </Grid.Col>
            <Grid.Col span={2}><Text truncate="end">{taskDetails}</Text></Grid.Col>
            <Grid.Col span={5}><Text truncate="end">{triggerDetailsText}</Text></Grid.Col>
            <Grid.Col span={2} miw={120}>
                    <Group gap="xs" justify="flex-end">
                    {(loading||switching)&&<Loader size="xs" />}
                        <Tooltip style={{zIndex:100}} label={sError||(enabled?'Disable':'Enable')} refProp="rootRef" opened={!!sError ? true : undefined} color={sError ? "red" : undefined } zIndex={100} >
                            <Switch disabled={!canEnable&&!enabled} onChange={()=>toggle()} checked={(switching||success)?!enabled:enabled} onMouseEnter={!!sError?sReset:undefined} />
                        </Tooltip>
                        <MenuTip label="Copy" Icon={IconCopy} error={cError} reset={cReset} onClick={()=>copy()} loading={copying} color="indigo" variant="subtle" />
                        <MenuTip label="Edit" Icon={IconPencil} onClick={edit} color="orange" variant="subtle" />
                        <MenuTip label="Delete" Icon={IconTrash} error={dError} reset={dReset} onClick={async () => await del()} loading={deleting} color="red" variant="subtle" />
                    </Group>
            </Grid.Col>
        </Grid>
    </Paper>
    )}
    </Draggable>)
}

export default function Schedules() {
    const { loadingSchedules } = useLoader();
    const dispatch = useDispatch();
    const schedules = useSelector(getSchedules);
    const [ schedule, editing, { add, close, edit } ] =  useEditor<Schedule>({ name: "", enabled: false, triggers: [], tasks: [] });
    const refresh = () => dispatch(loadSchedules());
    return (
    <Container size="xl">
        <Editor open={schedule} adding={!editing} close={close} refresh={refresh} />
        <Group justify="space-between">
            <Title mb="xs" >Schedules</Title>
            <Button onClick={()=>add()} loading={loadingSchedules} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loadingSchedules} >
            {schedules.length<=0?<Text c="dimmed" >No schedules in schema. <Anchor onClick={()=>add()} >Add</Anchor> schedules to automate rules.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={1}/>
                    <Grid.Col span={2}>Name</Grid.Col>
                    <Grid.Col span={2}>Task</Grid.Col>
                    <Grid.Col span={5}>Trigger</Grid.Col>
                    <Grid.Col span={2}/>
                </Grid>
            </Paper>}
            <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "schedules", from: source.index, to: destination?.index || 0 })) } >
            <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {(schedules||[]).map((schedule, index) => <Schedule index={index} key={schedule.name} schedule={schedule} edit={()=>edit(schedule)} refresh={refresh} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Wrapper>
    </Container>
    )
}
