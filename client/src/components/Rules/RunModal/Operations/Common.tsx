import { Box, Code, List } from '@mantine/core'
import classes from '../../../../Theme.module.css';

interface data {
    [k: string]: string;
}

export default function Common({ action }:{ action: any, resultant: boolean }) {
    if (!action.result.data) return <></>;
    const data = action.result.data as data;
    return (
    <Box>
        <List size="sm" icon={<>-</>} >
            {(Object.keys(data||[])).map((d, i)=>
                <List.Item key={i} className={classes.overflow} >
                    <Box style={{whiteSpace:"nowrap"}}>{d}: <Code>{JSON.stringify(data[d])}</Code></Box>
                </List.Item>
            )}
        </List>
    </Box>)
}
