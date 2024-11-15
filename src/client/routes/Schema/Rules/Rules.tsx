import { Anchor, Box, Button, Container, Divider, Grid, Group, Loader, Paper, Switch, Text, Title, Tooltip, useMantineTheme } from "@mantine/core";
import { IconCopy, IconExclamationCircle, IconGripVertical, IconPencil, IconPlayerPlay, IconPlus, IconTrash } from "@tabler/icons-react";
import { useLocation } from "wouter";
import { useConnectors, useDispatch, useLoader, useSelector } from "../../../hooks/redux";
import { getRules, getSchedules, loadRules, reorder } from "../../../providers/schemaSlice";
import Run from "../../../components/Run/Run";
import { useState } from "react";
import Wrapper from "../../../components/Wrapper";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { modals } from "@mantine/modals";
import MenuTip from "../../../components/MenuTip";
import useAPI from "../../../hooks/useAPI";
import { availableActions } from "../../../modules/actions";


function useDependencyWalker(name: string) {
    const schedules = useSelector(getSchedules);
    return () => {
        for (const schedule of schedules||[]) {
            for (const task of schedule.tasks) {
                if (!task.rules) continue;
                for (const rule of task.rules) {
                    if (rule === name) return schedule.name;
                }
            }
        }
    }
}

function IconMap({ actions }: { actions: Action[] }){
    const theme = useMantineTheme();
    return <Group gap={5}>
    {actions.map((action,key)=>{
        const act = availableActions.find(a=>a.name===action.name);
        if (!act) return <><IconExclamationCircle color="red" size={16}/></>;
        return <Tooltip key={`${key}${action.id}`} fz="xs" withArrow label={action.name||action.id}>
            <act.Icon color={act.color?theme.colors[act.color][6]:undefined} size={16} stroke={2} />
        </Tooltip>
    })}
    </Group>
}

function SourcesMap({ sources }: { sources: string[] }){
    const theme = useMantineTheme();
    const { proConnectors } = useConnectors();
    return <Group gap={5} >
    {sources.map((source,key)=>{
        const con = proConnectors.find(a=>a.name===source);
        if (!con) return <><IconExclamationCircle color="red" size={16}/></>;
        return <Tooltip key={`${key}${con.name}`} fz="xs" withArrow label={con.name}>
            <con.Icon color={con.color?theme.colors[con.color][6]:undefined} size={16} stroke={2} />
        </Tooltip>
    })}
    </Group>
}

function Rule({ index, rule: { name, enabled, ...rule }, refresh, run }: { index: number, rule: Rule, refresh(): Promise<void>, run(r: Rule): void }) {
    const loaders = useLoader();
    const loading = loaders[`loadingrules_${index}`];
    const [location, setLocation] = useLocation();
    const edit = () =>setLocation(`${location}/edit/${name}`);
    const { del, loading: deleting, error: dError, reset: dReset } = useAPI({
        url: `/rule`, data: { name }, schema: true,
        then: () => refresh(),
    });
    const { put: copy, loading: copying, error: cError, reset: cReset } = useAPI({
        url: `/rule/${name}/copy`, schema: true,
        then: () => refresh(),
    });
    const { data: success, put: toggle, loading: switching, error: sError, reset: sReset } = useAPI({
        url: `/rule/${name}/${enabled?'disable':'enable'}`, schema: true,
        then: () => refresh().then(()=>sReset()),
    });
    const walk = useDependencyWalker(name);
    const clickDel = () => {
        const dependencies = walk();
        modals.openConfirmModal({
            title: dependencies ? 'Delete In-Use Rule' : 'Delete Rule',
            children:
            <Box>
                {dependencies&&<Text fw="bold" c="red" size="xs" mb="xs" >Warning, schedule '{dependencies}' is using this rule.</Text>}
                <Text size="sm">Are you sure you want to delete <b>{name}</b>?<br/>This action is destructive and cannot be reversed.</Text>
            </Box>,
            labels: { confirm: 'Delete rule', cancel: "Cancel" },
            confirmProps: { color: 'red' },
            onConfirm: async () => await del(),
        });
    }

    const hInit = (rule.initActions||[]).length > 0;
    const hIter = (rule.iterativeActions||[]).length > 0;
    const hFin = (rule.finalActions||[]).length > 0;
    
    return (
        <Draggable index={index} draggableId={name}>
        {(provided, snapshot) => (
        <Paper mb="xs" p="xs" withBorder  {...provided.draggableProps} ref={provided.innerRef} >
            <Grid columns={17} justify="space-between"  align="center" >
                <Grid.Col span={1} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span={3}>
                    <Tooltip disabled={!rule.description} label={<><Text size="xs" >{rule.description}</Text></>} position="bottom-start" withArrow  color="gray">
                        <Text truncate="end">{name}</Text>
                    </Tooltip>
                </Grid.Col>
                <Grid.Col span={2}>
                    <Group justify="end" gap={5} >
                        {rule.primary&&<SourcesMap sources={[rule.primary as string,  ...rule.sources.map(s=>s.foreignName as string)]} />}
                    </Group>
                </Grid.Col>
                <Grid.Col span={7}>
                    <Group justify="start" gap={5} >
                        {hInit&&<IconMap actions={rule.initActions||[]} />}
                        {(hInit && hIter)&&<Divider orientation="vertical"/>}
                        {hIter&&<IconMap actions={rule.iterativeActions||[]} />}
                        {(hIter && hFin)&&<Divider orientation="vertical"/>}
                        {hFin&&<IconMap actions={rule.finalActions||[]} />}
                    </Group>
                </Grid.Col>
                <Grid.Col span={4} miw={160}>
                    <Group gap="xs" justify="flex-end">
                        {(loading||switching)&&<Loader size="xs" />}
                        <Tooltip style={{zIndex:100}} label={sError||(enabled?'Disable Scheduling':'Enable Scheduling')} refProp="rootRef" opened={!!sError ? true : undefined} color={sError ? "red" : undefined } zIndex={100} >
                            <Switch onChange={()=>toggle()} checked={(switching||success)?!enabled:enabled} onMouseEnter={!!sError?sReset:undefined} />
                        </Tooltip>
                        <MenuTip label="Run" Icon={IconPlayerPlay} error={cError} reset={cReset} onClick={()=>run({...rule, name, enabled})} loading={copying} color="lime" variant="subtle" />
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

export default function Rules() {
    const [location, setLocation] = useLocation();
    const { loadingRules } = useLoader();
    const dispatch = useDispatch();
    const rules = useSelector(getRules);
    const refresh = () => dispatch(loadRules());
    const [rule, setRule] = useState<Rule | undefined>(undefined);
    const run = (rule: Rule) => setRule(rule);
    const add = () =>setLocation(`${location}/edit`);
    return (
    <Container size="xl">
        <Run rule={rule} close={()=>setRule(undefined)} />
        <Group justify="space-between">
            <Group><Title mb="xs" >Rules</Title><Text c="dimmed" size="xs" >Configure rules which perform comparisons and execute actions.</Text></Group>
            <Button onClick={add} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loadingRules} >
            {rules.length<=0?<Text c="dimmed" >No rules configured. <Anchor onClick={add} >Add</Anchor> a rule to begin.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid columns={17} justify="space-between">
                    <Grid.Col span={1}/>
                    <Grid.Col span={3}>Name</Grid.Col>
                    <Grid.Col ta="end" span={2}>Connectors</Grid.Col>
                    <Grid.Col span={7}>Actions</Grid.Col>
                    <Grid.Col span={4}/>
                </Grid>
            </Paper>}
            <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "rules", from: source.index, to: destination?.index || 0 })) } >
            <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {rules.map((rule, index) =><Rule index={index} key={rule.name} rule={rule} refresh={refresh} run={run} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Wrapper>
    </Container>
    )
}