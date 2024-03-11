import { Accordion, Box, Code, Drawer, Indicator, useMantineTheme, Text } from '@mantine/core'
import { action } from './Evaluate'
import { availableActions } from '../../../data/common';
import Concealer from '../../Common/Concealer';
import Common from '../RunModal/Operations/Common';

function DataReader({ action, resultant = false }: { action: action, resultant: boolean }){
    switch (action.name) {
      //case "Create User": return <CreateUser action={action} resultant={resultant} />
      //case "Update Attributes": return <UpdateAtts action={action} resultant={resultant} />
      default: return <Common action={action} resultant={resultant} />
    }
}

function Action( { action }: { action: action } ) {
    return (
        <Box>
            {action.result.error&&<Text c="red">{action.result.error}</Text>}
            <DataReader action={action} resultant={false} />
            <Concealer fz="xs" label='Raw Output' >
                <pre style={{margin:0}} ><Code fz="xs" >{JSON.stringify(action, null, 2)}</Code></pre>
            </Concealer>
        </Box>
    )
}

export default function View( { viewing, view }: { viewing?: {name: string, open: string, actions: action[]}, view: (a: undefined) => void } ) {
    const theme = useMantineTheme();
    return (
    <Drawer size="xl" opened={!!viewing} onClose={()=>view(undefined)} title={`Action Explorer: ${viewing?.name}`}>
        <Accordion multiple defaultValue={[ viewing?.open||'0' ]}>
            {viewing?.actions.map((action, i)=>{
                const { Icon, color } = availableActions[action.name];
                const problem = action.result.error || action.result.warning;
                const col = !problem ? color?theme.colors[color][6]:undefined : theme.colors.gray[8];
                return (
                <Accordion.Item key={i} value={i.toString()} >
                    <Accordion.Control icon={
                    <Indicator disabled={!problem} size={10} color={action.result.warning?'orange':'red'} inline><Icon color={col} /></Indicator>
                    }>{action.name}</Accordion.Control>
                    <Accordion.Panel><Action action={action} /></Accordion.Panel>
                </Accordion.Item>)
            })}
        </Accordion>
    </Drawer>
    )
}
