import { Box, Button, Checkbox, Divider, Grid, Group, Pagination, Select, Switch, TextInput, Text, useMantineTheme, Indicator, Modal, Code, Stepper } from "@mantine/core";
import { IconSearch, IconRun, IconUserCheck } from "@tabler/icons-react";
import { availableActions } from "../../../data/common";
import { usePagination } from "@mantine/hooks";
import { useState } from "react";
import CreateUser from "./Operations/CreateUser";
import Common from "./Operations/Common";
import Status from "./Status";
import Concealer from "../../Common/Concealer";
import UpdateAtts from "./Operations/UpdateAtts";

export interface action {
    name: string;
    result: { warning?: string, error?: string, data?: {[k: string]: unknown} };
}

export interface match {
    id: string;
    display: string;
    checked: boolean;
    actions: action[];
    actionable: boolean;
    schema?: string;
    rule?: string;
}

function search(query: string, match: match){
    if (match.id.includes(query)) return true;
    if (match.display.includes(query)) return true;
    return false;
}
//TODO - consolidate errors and warnings.
function Row( { match, toggle, setAction, resultant = false, dash }:{ match: match, toggle: (id: string)=>()=>void, setAction: (a: action)=>void, resultant: boolean, dash: boolean } ){
    const theme = useMantineTheme();
    return (
        <Grid key={match.id} align="center">
        <Grid.Col pl="lg" span={1}>{!resultant&&<Switch disabled={!match.actionable} onChange={toggle(match.id)} checked={!!match.checked} />}</Grid.Col>
        {dash&&<Grid.Col span={1}>{match.schema}</Grid.Col>}
        {dash&&<Grid.Col span={1}>{match.rule}</Grid.Col>}
        <Grid.Col span={2}>{match.id}</Grid.Col>
        <Grid.Col span={dash?5:7}>{match.display}</Grid.Col>
        <Grid.Col span={2}>{
            match.actions.map((action,key)=>{
            const { Icon, color } = availableActions[action.name];
            if (action.result.warning) return <Icon onClick={()=>setAction(action)} style={{cursor:"pointer"}} key={key} color={theme.colors.gray[8]} size={16} stroke={2} />
            if (action.result.error) return <Indicator size={6} offset={3} color="red" inline key={key}>
                <Icon onClick={()=>setAction(action)} style={{cursor:"pointer"}} color={color?theme.colors[color][6]:undefined} size={16} stroke={2} />
            </Indicator>
            return <Icon onClick={()=>setAction(action)} key={key} style={{cursor:"pointer"}} color={color?theme.colors[color][6]:undefined} size={16} stroke={2} /> })}
        </Grid.Col>
    </Grid>
    )
}

function DataReader({ action, resultant = false }: { action: action, resultant: boolean }){
    switch (action.name) {
      case "Create User": return <CreateUser action={action} resultant={resultant} />
      case "Update Attributes": return <UpdateAtts action={action} resultant={resultant} />
      default: return <Common action={action} resultant={resultant} />
    }
}

interface Props {
    id?: string;
    matches: match[];
    setData: (data: unknown)=>void;
    run?: ()=>void;
    loading: boolean;
    resultant?: boolean;
    dash?: boolean;
}
export default function Finder( { id, matches, loading, setData, run, resultant = false, dash = false } : Props ) {

    const setMatches = (data: unknown) => setData((r: object) => ({...r, matches: data}));

    const [showActionless, setShowActionless] = useState<boolean>(true);
    const [query, setQuery] = useState<string>('');
    const [perPage, setPerPage] = useState<string>('15');
    const data = matches.filter((r: match)=>showActionless?true:(!r.actionable?false:true));
    const toggle = (id: string) => () => setMatches((data||[]).map((r: match)=>r.id!==id?r:{...r, checked: !r.checked }));
    const checked = (data||[]).filter((r: match)=>r.checked);
    const hasChecked = checked.length>0;
    const toggleAll = () => () => hasChecked ?
    setMatches((data||[]).map((r: match)=>({...r, checked: false }))) :
    setMatches((data||[]).map((r: match)=>(!r.actionable?r:{...r, checked: true })));

    const [action, setAction] = useState<action|undefined>(undefined);
    
    const filtered = query==='' ? (data||[]) : (data||[]).filter((r: match)=>search(query, r));
    const pageCount = Math.ceil(filtered.length / Number(perPage));
    const pagination = usePagination({ total: pageCount, initialPage: 1 });
    const paginated = filtered.slice((pagination.active-1)*Number(perPage), pagination.active*Number(perPage));
    
    return (
    <Box pb="xs" >
    {!loading&&<>
    <Modal title={`${action?.name} ${resultant?'Result':'Preview'}`} opened={!!action} onClose={()=>setAction(undefined)} styles={{header:{paddingBottom: 0}}} >
        {action&&<>
        {action.result.warning&&<Text c="orange">{action.result.warning}</Text>}
        {action.result.error&&<Text c="red">{action.result.error}</Text>}
        <DataReader action={action} resultant={resultant} />
        <Concealer fz="xs" label='Raw Output' >
            <pre style={{margin:0}} ><Code fz="xs" >{JSON.stringify(action, null, 2)}</Code></pre>
        </Concealer>
        </>}
    </Modal>
    <Grid justify="center">
        <Grid.Col span={2}>
            <TextInput
            mt="xs"
            variant="filled"
            placeholder={`Search ${(data||[]).length} entries...`}
            leftSection={<IconSearch size={15} />}
            value={query}
            onChange={(event)=>setQuery(event.currentTarget.value)}
            />
        </Grid.Col>
        {!dash&&<Grid.Col span={2}>
        {!resultant&&<Group justify="right" >
            <Checkbox labelPosition="left" mt={17} label="Display Actionless" checked={showActionless} onChange={()=>setShowActionless(!showActionless)}/>
        </Group>}
        </Grid.Col>}
        <Grid.Col span={2}>
            <Select
            mt="xs" variant="filled"
            placeholder="Pick one"
            onChange={v=>setPerPage(v as string)}
            value={perPage}
            data={[
                { value: '5', label: '5 Per Page' },
                { value: '15', label: '15 Per Page' },
                { value: '25', label: '25 Per Page' },
                { value: '50', label: '50 Per Page' },
                { value: '100', label: '100 Per Page' },
            ]}
            />
        </Grid.Col>
        <Grid.Col span="auto">
            <Pagination
            mt={12}
            onChange={(value)=>pagination.setPage(value)}
            value={pagination.active}
            total={pageCount}
            />
        </Grid.Col>
        <Grid.Col span={2}>
            {!resultant&&<Button onClick={run} leftSection={<IconRun />} disabled={!hasChecked} mt="xs" >Run {checked.length} Actions</Button>}
        </Grid.Col>
    </Grid>
    <Divider mt="xs"/>
    </>}
    <Divider mt="xs" label={<></>
    //<Stepper active={0} mt="xs" >
    //        <Stepper.Step icon={<IconUserCheck size={22} />} />
    //</Stepper>
    } />
    {loading&&<Group justify="center" ><Status resultant={resultant} /></Group>}
    {(data&&!loading)&&<>
    <Grid pt="xs" align="center">
        <Grid.Col pl="lg" span={1}>{!resultant&&<Switch onChange={toggleAll()} checked={hasChecked} />}</Grid.Col>
        {dash&&<Grid.Col span={1} fw="bold">Schema</Grid.Col>}
        {dash&&<Grid.Col span={1} fw="bold">Rule</Grid.Col>}
        <Grid.Col span={2} fw="bold">{id||"ID"}</Grid.Col>
        <Grid.Col span={dash?5:7} fw="bold">Display</Grid.Col>
        <Grid.Col span={2} fw="bold">Actions</Grid.Col>
    </Grid>
    {paginated.map((match: match) => <Row key={match.id} match={match} toggle={toggle} setAction={(a: action)=>setAction(a)} resultant={resultant} dash={dash} />)}
    </>}
    </Box>
    )
}
