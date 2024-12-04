import { Anchor, Badge, Box, Button, Container, Grid, Group, Loader, Paper, Text, Title, Tooltip, useMantineTheme } from "@mantine/core";
import { useDispatch, useLoader, useSelector } from "../../../hooks/redux";
import useEditor from "../../../hooks/useEditor";
import { getConnectors, loadConnectors, reorder } from "../../../providers/schemaSlice";
import Editor from "./Editor";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { IconCopy, IconGripVertical, IconPencil, IconPlus, IconTestPipe, IconTrash } from "@tabler/icons-react";
import Wrapper from "../../../components/Wrapper";
import { modals } from "@mantine/modals";
import MenuTip from "../../../components/MenuTip";
import useAPI from "../../../hooks/useAPI";
import useDependencyWalker from "../../../hooks/useDependencyWalker";
import { providers } from "./providers";

function Entry({ index, entry: { id, name, ...options }, edit, refresh }: { index: number, entry: Connector, edit(): void, refresh(): void }) {
    const theme = useMantineTheme();
    const loaders = useLoader();
    const loading = loaders[`loadingconnectors_${index}`];
    const { data: valid, post: validate, loading: validating, error: vError, reset: vReset } = useAPI<boolean>({
        url: `/connector/validate`, data: { id, name, ...options }, schema: true,
    });
    const { del, loading: deleting, error: dError, reset: dReset } = useAPI({
        url: `/connector`, data: { name }, schema: true,
        then: () => refresh(),
    });
    const { put: copy, loading: copying, error: cError, reset: cReset } = useAPI({
        url: `/connector/${name}/copy`, schema: true,
        then: () => refresh(),
    });
    const findConnector = (str = "",substring: string) => (new RegExp(`\\{\\{[^}]*${substring}\\.\\S+[^}]*\\}\\}`, 'g')).test(str);
    const walk = useDependencyWalker(name, findConnector, (name, connectors, rules)=>{
        for (const rule of rules||[]) {
            if (!rule.primary) continue;
            if (rule.primary === name) return `rule '${rule.name}' primary connector`;
            for (const source of rule.sources||[]) {
                if (source.foreignName === name) return `rule '${rule.name}' secondary connectors`;
            }
            //for (const context of rule.contexts||[]) {
            //    if (context.name === name) return `rule '${rule.name}' additional connectors`;
            //}
        }
    });

    const clickDel = () => {
        const dependencies = walk();
        modals.openConfirmModal({
            title: dependencies ? 'Delete In-Use Connector' : 'Delete Connector',
            children:
            <Box>
                {dependencies&&<Text fw="bold" c="red" size="xs" mb="xs" >Warning, usage detected in {dependencies}.</Text>}
                <Text size="sm">Are you sure you want to delete <b>{name}</b>?<br/>This action is destructive and cannot be reversed.</Text>
            </Box>,
            labels: { confirm: 'Delete connector', cancel: "Cancel" },
            confirmProps: { color: 'red' },
            onConfirm: async () => await del(),
        }); 
    }
    const provider = providers.find(p=>p.id===id);
    if (!provider) return <></>;
    return (
    <Draggable index={index} draggableId={name}>
    {(provided, _snapshot) => (
    <Paper mb="xs" p="xs" withBorder  {...provided.draggableProps} ref={provided.innerRef} >
        <Tooltip label="Test successfull" position="right" opened={valid||false} withArrow color="green" zIndex={100} >
        <Grid columns={17} justify="space-between"  align="center" >
            <Grid.Col span={2} style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                <Group justify="space-between">
                    <IconGripVertical size="1.2rem" />
                    <Group visibleFrom="sm" ><provider.Icon size={20} color={provider.color?theme.colors[provider.color][6]:undefined} /></Group>
                </Group>
            </Grid.Col>
            <Grid.Col span={9}><Text truncate="end">{name}</Text></Grid.Col>
            <Grid.Col span={2}>
                <Group justify="flex-start" visibleFrom="md">
                    <Tooltip label={provider.name} withArrow color={provider.color?theme.colors[provider.color][6]:undefined} >
                        <Badge color={provider.color?theme.colors[provider.color][6]:undefined} variant="light">{provider.id}</Badge>
                    </Tooltip>
                </Group>
            </Grid.Col>
            <Grid.Col span={4} miw={160}>
                <Group gap="xs" justify="flex-end">
                    {loading&&<Loader size="xs" />}
                    <MenuTip label="Test" Icon={IconTestPipe} error={vError} reset={vReset} onClick={()=>validate()} loading={validating} color="lime" variant="subtle" />
                    <MenuTip label="Copy" Icon={IconCopy} error={cError} reset={cReset} onClick={()=>copy()} loading={copying} color="indigo" variant="subtle" />
                    <MenuTip label="Edit" Icon={IconPencil} onClick={edit} color="orange" variant="subtle" />
                    <MenuTip label="Delete" Icon={IconTrash} error={dError} reset={dReset} onClick={clickDel} loading={deleting} color="red" variant="subtle" />
                </Group>
            </Grid.Col>
        </Grid></Tooltip>
    </Paper>
    )}
    </Draggable>)
}

export default function Connectors() {
    const dispatch = useDispatch();
    const { loadingConnectors: loading } = useLoader();
    const entries = useSelector(getConnectors);
    const refresh = () => dispatch(loadConnectors());
    const [ open, editing, { add, close, edit } ] =  useEditor<Connector>({ id: "", name: "", type: 'provider', headers: [] });
    return (
    <Container>
        <Editor open={open} adding={!editing} close={close} refresh={refresh} />
        <Group justify="space-between">
          <Group><Title mb="xs" >Connectors</Title><Text c="dimmed" size="xs" >Connectors provide data to iterate over and run actions.</Text></Group>
          <Button onClick={()=>add()} loading={loading} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loading} >
            {entries.length<=0?<Text c="dimmed" >No connectors configured. <Anchor onClick={()=>add()} >Add</Anchor> a connector to create rules.</Text>:
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={1}/>
                    <Grid.Col span={4}>Key</Grid.Col>
                    <Grid.Col span={4}>Value</Grid.Col>
                    <Grid.Col span={3}/>
                </Grid>
            </Paper>}
            <DragDropContext onDragEnd={({ destination, source }) => dispatch(reorder({ name: "dictionary", from: source.index, to: destination?.index || 0 })) } >
            <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {entries.map((entry, index) => <Entry index={index} key={entry.name} entry={entry} edit={()=>edit(entry)} refresh={refresh} />)}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
            </DragDropContext>
        </Wrapper>
    </Container>
    )
  }
  