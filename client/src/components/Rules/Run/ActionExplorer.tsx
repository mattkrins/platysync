import { Accordion, Box, Code, Drawer, Indicator, useMantineTheme, Notification, List } from '@mantine/core'
import { action } from './Evaluate'
import Concealer from '../../Common/Concealer';
import { IconAlertTriangle, IconHandStop, IconX } from '@tabler/icons-react';
import classes from '../../../Theme.module.css';
import { availableActions } from '../../../modules/common';

interface data {
    [k: string]: {[k: string]: unknown }|string|Array<string>;
}

function ObjectMap( { data }: { data: data }  ){
    return data.constructor === Array ? (data as Array<string>).map((d, i)=>
    <List.Item key={i} className={classes.overflow} >
        <Box style={{whiteSpace:"nowrap"}}>
            {(typeof d =="object")?<ObjectMap data={d||{}} />:<Code>{JSON.stringify(d)}</Code>}
        </Box>
    </List.Item>): Object.keys(data).map((d, i)=>
    <List.Item key={i} className={classes.overflow} >
        <Box style={{whiteSpace:"nowrap"}}>{d}:
            {(typeof data[d] =="object")?<ObjectMap data={data[d] as data} />:<Code>{JSON.stringify(data[d])}</Code>}
        </Box>
    </List.Item>);
}

function DataReadout({ action }:{ action: action }) {
    if (!action.result.data) return <></>;
    const data = action.result.data as data;
    return (
    <Box>
        <List size="sm" icon={<>-</>} >
        <ObjectMap data={data||{}} />
        </List>
    </Box>)
}


function Action( { action }: { action: action } ) {
    return (
        <Box>
            {action.result.error&&<Notification mb="xs" icon={<IconX size={20} />} withCloseButton={false} color="red" title="Error!">
            {action.result.error}
            </Notification>}
            {action.result.warn&&<Notification mb="xs" icon={<IconAlertTriangle size={20} />} withCloseButton={false} color="orange">
            {action.result.warn}
            </Notification>}
            <DataReadout action={action} />
            <Concealer fz="xs" label='Raw Output' >
                <pre style={{margin:0}} ><Code fz="xs" >{JSON.stringify(action, null, 2)}</Code></pre>
            </Concealer>
        </Box>
    )
}

export default function View( { viewing, view }: { viewing?: {name: string, open: string, actions: action[]}, view: (a: undefined) => void } ) {
    const theme = useMantineTheme();
    const error = viewing && viewing.actions.filter(a=>!a.result||a.result.error).length > 0;
    return (
    <Drawer size="xl" opened={!!viewing} onClose={()=>view(undefined)} title={`Action Explorer: ${viewing?.name}`}>
        <Accordion multiple defaultValue={[ viewing?.open||'0' ]}>
            {viewing?.actions.map((action, i)=>{
                const act = availableActions.find(a=>a.id===action.name);
                if (!act) return <></>;
                const problem = action.result.error || action.result.warn;
                const col = !problem ? act.color?theme.colors[act.color][6]:undefined : theme.colors.gray[8];
                return (
                <Accordion.Item key={i} value={i.toString()} >
                    <Accordion.Control icon={
                    <Indicator disabled={!problem} size={12} color={action.result.warn?'orange':'red'} inline><act.Icon color={col} /></Indicator>
                    }>{action.name}</Accordion.Control>
                    <Accordion.Panel><Action action={action} /></Accordion.Panel>
                </Accordion.Item>)
            })}
        </Accordion>
        {error&&<Notification mt="xs" icon={<IconHandStop size={20} />} withCloseButton={false} color="orange" title="Execution Halted">
            No futher conditions actions for '{viewing?.name}' were evaluated or run.
        </Notification>}
    </Drawer>
    )
}
