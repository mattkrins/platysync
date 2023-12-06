import { Box, Text, Code, List } from '@mantine/core'
import { action } from '../Finder'
import classes from '../../../../Theme.module.css';
import Concealer from '../../../Common/Concealer';

interface change {
    type: 'Add'|'Replace'|'Delete';
    name: string, value: string;
    currentValue: string;
    error?: string;
    success?: true;
}

interface data {
    [k: string]: unknown;
    directory: string;
    upn: string;
    changes: change[];
}

function Change( {change, r}: {change: change, r: boolean} ) {
  switch (change.type) {
    case 'Replace': return <List.Item key={change.name} className={classes.overflow} >
        {change.name}: <Code>Replace{r&&'d'} {change.currentValue||'<undefined>'} with '{change.value}'</Code>
    </List.Item>
    case 'Add': return <List.Item key={change.name} className={classes.overflow} >
        {change.name}: <Code>Set to '{change.value}'</Code>
    </List.Item>
    case 'Delete': return <List.Item key={change.name} className={classes.overflow} >
        delete{r&&'d'}: <Code>{change.name}</Code>
    </List.Item>
    default: break;
  }
}

export default function UpdateAtts({action, resultant}:{action: action, resultant: boolean }) {
    if (!action.result.data) return <></>;
    const data = action.result.data as data;
    const errors = (data.changes||[]).filter(c=>c.error);
    return (
    <Box>
        <Text fz="sm" >Directory: <Code>{data.directory||""}</Code></Text>
        <Text fz="sm" >User Principal Name: <Code>{data.upn||""}</Code></Text>
        <Concealer fz="sm" label='Changes' open >
            <List size="xs" icon={<>-</>} >
                {(data.changes||[]).map((change)=>
                    <Change change={change} r={resultant} />
                )}
            </List>
        </Concealer>
        {errors.length>0&&<Concealer fz="sm" label='Errors' open >
            <List size="xs" icon={<>-</>} >
                {errors.map((change)=>
                    <List.Item key={change.name} className={classes.overflow} >{change.name}: <Code>{change.error}</Code></List.Item>
                )}
            </List>
        </Concealer>}
    </Box>)
}
