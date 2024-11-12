import { Grid, Group, Indicator, Paper, Tooltip, useMantineTheme } from "@mantine/core";
import { IconGripVertical, IconTrash } from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { availableAction, availableActions } from "../../../../modules/actions";
import MenuTip from "../../../../components/MenuTip";

export default function Action({ index, action, type, form }: { index: number, action: Action, form: UseFormReturnType<Rule>, type: string }) {
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
    const actionData = availableActions.find(a=>a.name===action.name) as availableAction;
    if (!action) return <MenuTip label="Delete" Icon={IconTrash} onClick={remove} color="red" variant="subtle" />;
    const { Icon, color, name, label, validator, overwriter, Options, provider, iterative: Context } = actionData;
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
                    </Grid>
                </Paper>
            </Indicator>)}
        </Draggable>
    )
}
