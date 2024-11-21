import { Accordion, Box, Code, Drawer, Indicator, useMantineTheme, Notification, List, Text } from '@mantine/core'
import { IconAlertTriangle, IconHandStop, IconX } from '@tabler/icons-react';
import classes from '../../theme.module.css';
import Concealer from '../Concealer';
import { availableOperations } from '../../routes/Schema/Rules/Editor/operations';

interface data {
    [k: string]: {[k: string]: unknown }|string|Array<string>;
}

function ObjectMap( { data }: { data: data }  ){
    return data.constructor === Array ? (data as Array<string>).map((d, i)=>
    <List.Item key={i} className={classes.overflow} >
        <Box style={{whiteSpace:"nowrap"}}>
            {(typeof d =="object")?<ObjectMap data={d||{}} />:<Code c={isNaN(data[d] as unknown as number)?undefined:'orange'} >{String(d)}</Code>}
        </Box>
    </List.Item>): Object.keys(data).map((d, i)=>
    <List.Item key={i} className={classes.overflow} >
        <Box style={{whiteSpace:"nowrap"}}>{d}:
            {(typeof data[d] =="object")?<ObjectMap data={data[d] as data} />:<Code c={isNaN(data[d] as unknown as number)?undefined:'orange'} >{String(data[d])}</Code>}
        </Box>
    </List.Item>);
}

function DataReadout({ action }:{ action: actionResult }) {
    if (!action.result.data) return <></>;
    const {error, ...data} = action.result.data as data;
    return (
    <Box>
        <List size="sm" icon={<>-</>} >
        <ObjectMap data={data||{}} />
        </List>
        {error && typeof error =="string" &&
        <Notification mt="xs" icon={<IconX size={20} />} withCloseButton={false} color="red" title="Error Data">
            {error}
        </Notification>}
    </Box>)
}


function Action( { action, name }: { action: actionResult, name: string } ) {
    return (
        <Box>
            {action.result.error&&<><Notification withBorder mb="xs" icon={<IconX size={20} />} withCloseButton={false} color="red" title="Error!">
            {action.result.error as string}
            {action.noblock&&<Text size="xs" >Error was ignored and execution continued.</Text>}
            </Notification>
            {!action.noblock&&<Notification withBorder mb="xs" icon={<IconHandStop size={20} />} withCloseButton={false} color="orange" title="Execution Halted">
                No futher actions were evaluated or run for '{name}'.
            </Notification>}
            </>}
            {action.result.warn&&<Notification withBorder mb="xs" icon={<IconAlertTriangle size={20} />} withCloseButton={false} color="orange" title="Warning!" >
            {action.result.warn}
            </Notification>}
            <DataReadout action={action} />
            <Concealer fz="xs" label='Raw Output' >
                <pre style={{margin:0}} ><Code fz="xs" >{JSON.stringify(action, null, 2)}</Code></pre>
            </Concealer>
        </Box>
    )
}

export default function ActionExplorer( { viewing, view }: { viewing?: {name: string, open: string, actions: actionResult[]}, view: (a: undefined) => void } ) {
    const theme = useMantineTheme();
    return (
    <Drawer size="xl" opened={!!viewing} onClose={()=>view(undefined)} title={`Action Explorer: ${viewing?.name}`}>
        <Accordion multiple defaultValue={[ viewing?.open||'0' ]}>
            {viewing?.actions.map((action, i)=>{
                const act = availableOperations.find(a=>a.name===action.name);
                if (!act) return <></>;
                const problem = action.result.error || action.result.warn;
                const col = !problem ? act.color?theme.colors[act.color][6]:undefined : theme.colors.gray[8];
                return (
                <Accordion.Item key={i} value={i.toString()} >
                    <Accordion.Control icon={
                    <Indicator processing={!!action.result.error} disabled={!problem} size={12} color={action.result.warn?'orange':'red'} inline><act.Icon color={col} /></Indicator>
                    }>{action.display||act.label||act.name} {(action.display&&action.display!==act.name)&&<Text component='span' c="dimmed" >({act.name})</Text>}</Accordion.Control>
                    <Accordion.Panel><Action action={action} name={viewing?.name} /></Accordion.Panel>
                </Accordion.Item>)
            })}
        </Accordion>
    </Drawer>
    )
}
