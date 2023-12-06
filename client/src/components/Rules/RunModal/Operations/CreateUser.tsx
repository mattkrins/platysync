import { Box, Text, Code, List } from '@mantine/core'
import { action } from '../Finder'
import classes from '../../../../Theme.module.css';
import Concealer from '../../../Common/Concealer';

interface data {
    [k: string]: unknown;
    cn: string;
    upn: string;
    sam: string;
    base: string;
    ou: string;
    dn: string;
    enable: boolean;
    password: string;
    attributes: { name: string, value: string }[];
    groups: string[];
}

export default function CreateUser({action, resultant}:{action: action, resultant: boolean }) {
    if (!action.result.data) return <></>;
    const data = action.result.data as data;
    return (
    <Box>
        <Text fz="sm" >Canonical Name: <Code>{data.cn||""}</Code></Text>
        <Text fz="sm" >User Principal Name: <Code>{data.upn||""}</Code></Text>
        <Text fz="sm" >SAM Account Name: <Code>{data.sam||""}</Code></Text>
        <Box className={classes.overflow} >
            <Text fz="sm" >Organizational Unit: <Code>{data.ou||""},{data.base||""}</Code></Text>
        </Box>
        <Box className={classes.overflow} >
            <Text fz="sm" >Organizational Unit: <Code>{data.dn||""}</Code></Text>
        </Box>
        <Text fz="sm" >{resultant?'':'Sample '}Password: <Code>{data.password||""}</Code></Text>
        <Text fz="xs" pt="xs" >Account will be {data.enable?'enabled':'disabled'} on creation.</Text>
        <Concealer fz="sm" label='Attributes' >
            <List size="xs" icon={<>-</>} >
                {(data.attributes||[]).map(({name, value})=>
                    <List.Item key={name}>{name}: <Code>{value}</Code></List.Item>
                )}
            </List>
        </Concealer>
        <Concealer fz="sm" label='Security Groups' >
            <List size="xs" icon={<>-</>} >
                {(data.groups||[]).map((group, i)=>
                    <List.Item key={i} className={classes.overflow} ><Box style={{whiteSpace:"nowrap"}}>{group}</Box></List.Item>
                )}
            </List>
        </Concealer>
    </Box>)
}
