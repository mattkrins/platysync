import { ActionIcon, Checkbox, Divider, Group, Indicator, Table, TextInput, Tooltip, useMantineTheme } from "@mantine/core";
import { availableActions } from "../../modules/actions";
import ActionExplorer from "./ActionExplorer";
import { useState } from "react";
import { IconLetterCase, IconSearch } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";

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

function useHeader({ count }) {
    const [query, search] = useState<string>("");
    const [sE, { toggle: SE }] = useDisclosure(false);
    const [eE, { toggle: EE }] = useDisclosure(false);
    const [sW, { toggle: SW }] = useDisclosure(false);
    const [eW, { toggle: EW }] = useDisclosure(false);
    const [cased, { toggle: toggleCase }] = useDisclosure(false);
    const Header = (
        <Group justify="space-between" miw="600px" >
            <TextInput
            placeholder={`Search ${count} entries`}
            leftSection={<IconSearch size={16} stroke={1.5} />}
            visibleFrom="xs"
            value={query}
            onChange={e=>search(e.currentTarget.value)}
            rightSection={<ActionIcon variant={cased?"subtle":"light"} onClick={toggleCase} color="gray" size={24}><IconLetterCase size={18} /></ActionIcon>}
            />
        </Group>
    ); return { Header, query }
}

export default function Evaluate( { evaluated, setEvaluated }: EvalProps ) {
    const { primaryResults, initActions, finalActions, columns } = evaluated;
    const [query, search] = useState<string>("");
    const [viewing, view] = useState<{name: string, open: string, actions: actionResult[]}|undefined>();
    return (<>
    <ActionExplorer viewing={viewing} view={view} />
    <ActionMap actions={initActions} view={view} />
    <Divider/>
    {primaryResults.length>0&&<Table stickyHeader >
        <Table.Thead>
            <Table.Tr>
                <Table.Th w={56} ><Checkbox /></Table.Th>
                <Table.Th>ID</Table.Th>
                {columns.map(c=><Table.Th key={c} >{c}</Table.Th>)}
                <Table.Th>Actions</Table.Th>
            </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{primaryResults.map(r=><TableRow key={r.id} r={r} c={columns} />)}</Table.Tbody>
    </Table>}
    <ActionMap actions={finalActions} view={view} />
    </>
    )
}
