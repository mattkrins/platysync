import { ActionIcon, Button, Grid, Group, Loader, Switch, Text } from "@mantine/core";
import useAPI from "../../hooks/useAPI";
import Container from "../Common/Container";
import Head from "../Common/Head";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { IconGripVertical, IconPencil, IconTrash } from "@tabler/icons-react";
import classes from '../../Theme.module.css';
import AddSchedule from "./AddSchedule";
import { useDisclosure, useListState } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import cronstrue from 'cronstrue';

export interface schedule {
    id: string;
    index: number;
    schema: string;
    rules: string[];
    cron: string;
    monitor: string;
    enabled: boolean;
}

export default function Schedules() {

    const mutate = (e: schedule[])=>e
    .map((r: schedule)=>({...r, rules: r.rules? JSON.parse(r.rules as unknown as string): [], type: r.monitor ? 'Monitor' : 'Schedule' }))
    .sort((a, b) => a.index - b.index);
    const [schedules, handlers] = useListState<schedule>([]);
    const { loading: l1 } = useAPI({
        url: "/schedule",
        default: [],
        preserve: true,
        fetch: true,
        mutate,
        then: (schedules) => handlers.setState(schedules)
    });
    
    
    const [opened, { open, close }] = useDisclosure(false);
    
    const [ editing, setEditing ] = useState<schedule|undefined>(undefined);

    const initialValues = { schema: '', type: '', rules: [], cron: '' , monitor: '' };
    const form = useForm({
        initialValues, validate: {
            cron: (value) => {
                if (form.values.type === "Monitor") return false;
                const cron = cronstrue.toString(value, { throwExceptionOnParseError: false });
                const invalid = cron.includes("An error occured when generating the expression description");
                return invalid ? cron : null
            },
            monitor: (value) => {
                if (form.values.type === "Schedule") return false;
                return value.trim()==="" && "Path required."
            },
        },
    });
    useEffect(()=>{
        form.reset();
        if (editing) {form.setValues(editing as never)} else {form.setValues(initialValues); }
        form.setInitialValues(initialValues);
    }, [ editing ]);

    const { post: add, loading: l2 } = useAPI({
        url: `/schedule`,
        data: form.values,
        before: () => form.validate(),
        check: () => !form.isValid(),
        catch: ({validation}) => form.setErrors(validation),
        mutate,
        then: (schedules) => {
            handlers.setState(schedules);
            close();
            notifications.show({ title: "Success",message: 'Schedule Added.', color: 'lime', });
        }
    });

    const { put: order, loading: l6 } = useAPI({
        url: `/schedule/reorder`,
        fdata: ({from,to}:{from:number,to:number}) => ({from,to}),
        mutate,
        then: (schedules) => handlers.setState(schedules)
        
    });
    const reorder = (from:number,to:number) =>{
        handlers.reorder({ from, to });
        order({from,to});
    }

    const { put: save, loading: l3 } = useAPI({
        url: `/schedule`,
        data: form.values,
        before: () => form.validate(),
        check: () => !form.isValid(),
        catch: ({validation}) => form.setErrors(validation),
        furl: ({id}:{id:string}) => `/schedule/${id}`,
        mutate,
        then: (schedules) => {
            handlers.setState(schedules);
            close();
            notifications.show({ title: "Success",message: 'Schedule Modified.', color: 'lime', });
        }
    });

    const { put: tog, loading: l4 } = useAPI({
        url: `/schedule`,
        data: form.values,
        furl: ({id}:{id:string}) => `/schedule/${id}/toggle`,
        mutate,
        then: (schedules) => handlers.setState(schedules)
    });

    const { del, request: r1, loading: l5 } = useAPI({
        cleanup: true,
        furl: ({id}:{id:string}) => `/schedule/${id}`,
        mutate,
        then: (schedules) => {
            handlers.setState(schedules);
            notifications.show({ title: "Success",message: 'Schedule Removed.', color: 'lime', });
        },
    });

    const loading = l1||l2||l3||l4||l5||l6;

    const edit = (schedule: schedule) => { setEditing(schedule); open(); }
    const toggle = (item: schedule) => {
        handlers.setState(schedules.map((r: schedule)=>r.id!==item.id?r:{...r, enabled: !item.enabled }));
        tog({id: item.id});
    }

    const close2 = () => {
        setEditing(undefined);
        close();
    }

    return (
        <Container label={<Head rightSection={<Group>{l1&&<Loader size="sm" />}<Button onClick={open} variant="light" >Add</Button></Group>} >Schedules</Head>} >
            <AddSchedule opened={opened} close={close2} form={form} add={add} save={save} editing={editing} loading={loading} />
            {schedules.length===0&&<Text c="lighter" size="sm" >{loading?'Loading...':'No Schedules in effect.'}</Text>}
            <DragDropContext onDragEnd={({ destination, source }) => reorder( source.index, destination?.index || 0 ) } >
                <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => (
                <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                    {schedules.map((item: schedule) => {
                    const display = item.cron ? cronstrue.toString(item.cron, { throwExceptionOnParseError: false }) : `Watch: ${item.monitor}`;
                    return (
                    <Draggable key={item.id} index={item.index} draggableId={item.id}>
                        {(provided) => (
                        <Grid align="center" ref={provided.innerRef} mt="xs" {...provided.draggableProps} className={classes.item}
                        style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
                        >
                            <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                                <Group><IconGripVertical size="1.2rem" /></Group>
                            </Grid.Col>
                            <Grid.Col span="auto"><Text size="xs" lineClamp={1} >{display}</Text></Grid.Col>
                            <Grid.Col span="auto"><Text size="xs" lineClamp={1} >
                                Schema: {item.schema} {item.rules.length>0&&` | Rules: ${item.rules}`}
                            </Text></Grid.Col>
                            <Grid.Col span="content">
                            <Group justify="right" gap="xs">
                                <Switch disabled={loading} onClick={()=>toggle(item)} checked={item.enabled} color="teal" />
                                <ActionIcon disabled={loading} loading={r1.id===item.id} onClick={()=>del({id: item.id})} variant="subtle" color="red"><IconTrash size={16} stroke={1.5} /></ActionIcon>
                                <ActionIcon disabled={loading} onClick={()=>edit(item)} variant="subtle" color="orange"><IconPencil size={16} stroke={1.5} /></ActionIcon>
                            </Group>
                        </Grid.Col>
                        </Grid>
                        )}
                    </Draggable>
                    )})}
                    {provided.placeholder}
                </div>
                )}
                </Droppable>
            </DragDropContext>

        </Container>
    )
}
