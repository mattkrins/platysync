import { ActionIcon, Checkbox, Divider, Group, Indicator, Table, TextInput, Tooltip, useMantineTheme } from "@mantine/core";
import { availableActions } from "../../modules/actions";
import ActionExplorer from "./ActionExplorer";
import { useState } from "react";
import { IconEye, IconEyeCheck, IconEyeClosed, IconEyeX, IconLetterCase, IconSearch, IconX } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import MenuTip from "../MenuTip";

interface EvalProps {
    evaluated: response;
    setEvaluated: (data: React.SetStateAction<response>) => void;
}

function IconMap({ actions, size = 16, click }: { actions: actionResult[], size?: number, click?: (open: string)=> () => void }){
    const theme = useMantineTheme();
    return actions.map((action,key)=>{
        const act = availableActions.find(a=>a.name===action.name);
        if (!act) return <></>;
        const problem = action.result.error || action.result.warn;
        const col = !problem ? act.color?theme.colors[act.color][6]:undefined : theme.colors.gray[8];
        return <Tooltip key={key} fz="xs" withArrow label={action.display||action.name}>
        <Indicator disabled={!problem} size={size/3} offset={3} color={action.result.warn?'orange':'red'} inline>
            <act.Icon onClick={click&&click(key.toString())} style={{cursor:"pointer"}} color={col} size={size} stroke={2} />
        </Indicator></Tooltip>
    })
}

function ActionMap({ actions, view }: { actions: actionResult[], view: (id: {name: string, open: string, actions: actionResult[]}) => void }){
    const click = (open: string) => () => view({name: 'Init', open, actions });
    return actions.length<=0?<Divider />:
    <Divider label={<Group><IconMap actions={actions} size={22} click={click} /></Group>} />
}

function TableRow({ r, c }: { r: primaryResult, c: string[] }) {
    const cl = c.map(c=>(r.columns.find(rc=>rc.name===c)?.value||""));
    return (
    <Table.Tr>
        <Table.Td><Checkbox /></Table.Td>
        <Table.Td>{r.id}</Table.Td>
        {cl.map(c=><Table.Td key={c} >{c}</Table.Td>)}
        <Table.Td><IconMap actions={r.actions} size={16} /></Table.Td>
    </Table.Tr>
    )
}

function Header({ count, q, e, w, c, Q, E, W, C }: {
    count: number, q: string, e: number, w: number, c: boolean, Q(s:string):void, E(e:number):void, W(w:number):void, C():void }) {
    return (
        <Group justify="space-between" miw="600px" >
            <TextInput
            placeholder={`Search ${count} entries`}
            leftSection={<IconSearch size={16} stroke={1.5} />}
            visibleFrom="xs"
            value={q}
            onChange={e=>Q(e.currentTarget.value)}
            rightSection={<ActionIcon variant={c?"subtle":"light"} onClick={C} color="gray" size={24}><IconLetterCase size={18} /></ActionIcon>}
            />
            <Group>
                <Tooltip label={{0:"Errors Disabled",1:"Errors Visible",2:"Errors Enabled"}[e]}>
                    <Indicator color="red" size={{0:5,1:7,2:9}[e]} ><ActionIcon color={{0:"gray",1:"gray",2:"red"}[e]} variant="light" onClick={()=>E(e<2?e+1:0)} >
                        {{0:<IconEyeX size={18} />,1:<IconEye size={18} />,2:<IconEyeCheck size={18} />}[e]}
                    </ActionIcon></Indicator>
                </Tooltip>
                <Tooltip label={{0:"Warnings Disabled",1:"Warnings Visible",2:"Warnings Enabled"}[w]}>
                    <Indicator color="orange" size={{0:5,1:7,2:9}[w]} ><ActionIcon color={{0:"gray",1:"gray",2:"orange"}[w]} variant="light" onClick={()=>W(w<2?w+1:0)} >
                        {{0:<IconEyeX size={18} />,1:<IconEye size={18} />,2:<IconEyeCheck size={18} />}[w]}
                    </ActionIcon></Indicator>
                </Tooltip>
            </Group>
        </Group>
    );
}

function TableData({ primaryResults, columns }: { primaryResults: primaryResult[], columns: string[] }) {
    return (
    <Table stickyHeader >
        <Table.Thead>
            <Table.Tr>
                <Table.Th w={56} ><Checkbox /></Table.Th>
                <Table.Th>ID</Table.Th>
                {columns.map((c)=><Table.Th key={c} >{c}</Table.Th>)}
                <Table.Th>Actions</Table.Th>
            </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{primaryResults.map((r,i)=><TableRow key={r.id||i} r={r} c={columns} />)}</Table.Tbody>
    </Table>
    )
}

export default function Evaluate( { evaluated, setEvaluated }: EvalProps ) {
    const { primaryResults, initActions, finalActions, columns } = evaluated;
    const [viewing, view] = useState<{name: string, open: string, actions: actionResult[]}|undefined>();
    const [q, Q] = useState<string>("");
    const [e, E] = useState<number>(0);
    const [w, W] = useState<number>(2);
    const [c, { toggle: C }] = useDisclosure(false);
    return (<>
    <ActionExplorer viewing={viewing} view={view} />
    <ActionMap actions={initActions} view={view} />
    {primaryResults.length>0&&<>
    <Header count={0} q={q} e={e} w={w} c={c} Q={Q} E={E} W={W} C={C} />
    <Divider mt="sm" />
    <TableData primaryResults={primaryResults} columns={columns} /></>}
    <ActionMap actions={finalActions} view={view} />
    </>
    )
}
