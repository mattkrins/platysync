import { ActionIcon, Checkbox, Divider, Group, Indicator, Menu, Pagination, Table, TextInput, Tooltip, useMantineTheme, Text, Notification } from "@mantine/core";
import ActionExplorer from "./ActionExplorer";
import { useMemo, useState } from "react";
import { IconCheck, IconDots, IconDownload, IconEye, IconEyeCheck, IconEyeX, IconFilter, IconLetterCase, IconQuestionMark, IconSearch, IconX } from "@tabler/icons-react";
import { useDisclosure, usePagination } from "@mantine/hooks";
import Exporter from "../Exporter";
import Status from "./Status";
import { availableOperations } from "../../routes/Schema/Rules/Editor/operations";

const defaultPage = 50
const pages = [ 10, 25, 50, 100, 1000 ];

function find(query: string, r: primaryResult, caseSen: boolean, columns: string[]){
    if (r.id && (caseSen?String(r.id).toLowerCase().includes(query.toLowerCase()):String(r.id).includes(query))) return true;
    if (columns.find(data=>caseSen?data.toLowerCase().includes(query.toLowerCase()):data.includes(query))) return true;
    return false;
}

interface EvalProps {
    evaluated: response;
    setEvaluated: (data: React.SetStateAction<response>) => void;
    loading?: boolean;
    maximized?: boolean;
    error?: string;
    execute?: boolean
}

function IconMap({ actions, size = 16, click }: { actions: actionResult[], size?: number, click?: (open: string)=> () => void }){
    const theme = useMantineTheme();
    return actions.map((action,key)=>{
        const act = availableOperations.find(a=>a.name===action.name);
        if (!act) return <></>;
        const problem = action.result.error || action.result.warn;
        const col = !problem ? act.color?theme.colors[act.color][6]:undefined : theme.colors.gray[8];
        return <Tooltip key={key} fz="xs" withArrow label={action.display||act.label||act.name}>
        <Indicator disabled={!problem} size={size/3} offset={3} color={action.result.warn?'orange':'red'} inline>
            <act.Icon onClick={click&&click(key.toString())} style={{cursor:"pointer"}} color={col} size={size} stroke={2} />
        </Indicator></Tooltip>
    })
}

function ActionMap({ actions, view, name }: { actions: actionResult[], view: (id: {name: string, open: string, actions: actionResult[]}) => void, name: string }){
    const click = (open: string) => () => view({name, open, actions });
    return actions.length<=0?<Divider mb="xs" />:
    <Divider h={24} label={<Group gap="xs" ><IconMap actions={actions} size={22} click={click} /></Group>} />
}

function TableRow({ r, c, dE, dW, t, v, max, aA }: {
    r: primaryResult, c: string[], dE: boolean, dW: boolean, t: (id: string) => void,
    v: (id: {name: string, open: string, actions: actionResult[]}) => void, max: boolean, aA: boolean
    }) {
    const cl = c.map(c=>(r.columns.find(rc=>rc.name===c)?.value||""));
    const disabled = (dE && r.error) || (dW && r.warn);
    const click = (open: string) => () => v({name: r.id, open, actions: r.actions });
    return (
    <Table.Tr>
        <Table.Td><Checkbox disabled={disabled} onChange={()=>t(r.id)} checked={!!r.checked} /></Table.Td>
        <Table.Td maw={max?undefined:200} ><Text size="sm" truncate={max?undefined:"end"} >{r.id}</Text></Table.Td> 
        {cl.map(c=><Table.Td key={c} maw={max?undefined:200} ><Text size="sm" truncate={max?undefined:"end"} >{c}</Text></Table.Td>)}
        {aA&&<Table.Td><Group gap={2} ><IconMap actions={r.actions} size={16} click={click} /></Group></Table.Td>}
    </Table.Tr>
    )
}

function TableData({ p, c, dE, dW, v, pR, sE, max, id }: {
    p: primaryResult[], c: string[], dE: boolean, dW: boolean, max: boolean,
    v: (id: {name: string, open: string, actions: actionResult[]}) => void,
    pR: primaryResult[], sE: (data: React.SetStateAction<response>) => void, id?: string }) {
    const toggle = (id: string) => sE(response=>({...response, primaryResults: pR.map(r=>r.id!==id?r:{...r, checked: !r.checked }) }));
    const allChecked = useMemo(()=>pR.every(r => r.checked),[ pR ]);
    const noneChecked = useMemo(()=>pR.every(r => !r.checked),[ pR ]);
    const someChecked = useMemo(()=>pR.some(r => r.checked),[ pR ]);
    const someActions = useMemo(()=>pR.every(r => r.actions.length>0),[ pR ]);
    const indeterminate = someChecked && !allChecked;
    const toggleAll = () => {
        if (indeterminate || noneChecked) return sE(response=>({ ...response,
            primaryResults: pR.map(r=>({ ...r, checked: (r.error ? !dE : ( (r.warn ? !dW : true) )) }))
        }));
        return sE(response=>({...response, primaryResults: pR.map(r=>({...r, checked: false })) }));
    }
    return (
    <Table stickyHeader >
        <Table.Thead>
            <Table.Tr>
                <Table.Th w={56} ><Checkbox checked={allChecked} indeterminate={indeterminate} onChange={toggleAll} /></Table.Th>
                <Table.Th>{id||'ID'}</Table.Th>
                {c.map((c)=><Table.Th key={c} >{c}</Table.Th>)}
                {someActions&&<Table.Th>Actions</Table.Th>}
            </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{p.map((r,i)=><TableRow key={r.id||i} r={r} c={c} dE={dE} dW={dW} t={toggle} v={v} max={max} aA={someActions} />)}</Table.Tbody>
    </Table>
    )
}

function Header({ q, e, w, c, s, Q, E, W, C, S, eC, wC, fC, p, PP, cols, exp, id }: {
    q: string, e: number, w: number, c: boolean, s?: string,
    Q(s:string):void, E(e:number):void, W(w:number):void, C():void, S(s?:string):void,
    eC: number, wC: number, fC: number, p: { active: number, setPage: (pageNumber: number) => void, total: number, perPage: number }, PP(w:number):void,
    cols: string[], exp(): void, id?: string }) {
    return (
        <Group justify="space-between" miw="600px" >
            <TextInput
            placeholder={`Search ${fC} entries`}
            leftSection={<IconSearch size={16} stroke={1.5} />}
            visibleFrom="xs"
            value={q}
            onChange={e=>Q(e.currentTarget.value)}
            rightSection={<ActionIcon variant={!c?"subtle":"light"} onClick={C} color="gray" size={24}><IconLetterCase size={18} /></ActionIcon>}
            />
            
            <Group gap={"xs"} >
            {p.total>1&&p.perPage>0&&<Pagination total={p.total} onChange={(value)=>p.setPage(value)} value={p.active} />}
                <Menu shadow="md">
                    <Menu.Target>
                        <Tooltip label="Pagination"><ActionIcon variant={p.perPage===defaultPage?"default":undefined} size={32} ><IconDots size={20}/></ActionIcon></Tooltip>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>Rows per page</Menu.Label>
                        {pages.map(n=><Menu.Item leftSection={p.perPage===n&&<IconCheck size={16} />} onClick={()=>PP(n)} >{n} per page</Menu.Item>)}
                        <Menu.Item leftSection={p.perPage===0&&<IconCheck size={16} />} onClick={()=>PP(0)} >No Pagination</Menu.Item>
                    </Menu.Dropdown>
                </Menu>
                <Menu shadow="md">
                    <Menu.Target>
                        <Tooltip label="Sorting"><ActionIcon variant={s===undefined?"default":undefined} size={32} ><IconFilter size={18}/></ActionIcon></Tooltip>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>Sort by column</Menu.Label>
                        <Menu.Item leftSection={s===undefined&&<IconCheck size={16} />} onClick={()=>S(undefined)} >By {id||'ID'}</Menu.Item>
                        {cols.map(c=><Menu.Item leftSection={s===c&&<IconCheck size={16} />} onClick={()=>S(c)} >By {c}</Menu.Item>)}
                        <Menu.Divider/>
                        <Menu.Item leftSection={s==="Actions"&&<IconCheck size={16} />} onClick={()=>S("Actions")} >By Action Count</Menu.Item>
                        <Menu.Item leftSection={s==="Errors"&&<IconCheck size={16} />} onClick={()=>S("Errors")} >Errors First</Menu.Item>
                        <Menu.Item leftSection={s==="Warns"&&<IconCheck size={16} />} onClick={()=>S("Errors")} >Warnings First</Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
            <Group gap="xs" >
                <Tooltip label="Export Results">
                    <ActionIcon variant="default" onClick={()=>exp()} ><IconDownload size={16} /></ActionIcon>
                </Tooltip>
                <Tooltip label={{0:`${eC} Errors Hidden`,1:`${eC} Errors Disabled`,2:`${eC} Errors Enabled`}[e]}>
                    <Indicator color="red" size={{0:5,1:7,2:9}[e]} disabled={eC<=0} >
                        <ActionIcon disabled={eC<=0} color={{0:"gray",1:"gray",2:"red"}[e]} variant="light" onClick={()=>E(e<2?e+1:0)} >
                            {{0:<IconEyeX size={18} />,1:<IconEye size={18} />,2:<IconEyeCheck size={18} />}[e]}
                        </ActionIcon>
                    </Indicator>
                </Tooltip>
                <Tooltip label={{0:`${wC} Warnings Hidden`,1:`${wC} Warnings Disabled`,2:`${wC} Warnings Enabled`}[w]}>
                    <Indicator color="orange" size={{0:5,1:7,2:9}[w]} disabled={wC<=0} >
                        <ActionIcon disabled={wC<=0} color={{0:"gray",1:"gray",2:"orange"}[w]} variant="light" onClick={()=>W(w<2?w+1:0)} >
                            {{0:<IconEyeX size={18} />,1:<IconEye size={18} />,2:<IconEyeCheck size={18} />}[w]}
                        </ActionIcon>
                    </Indicator>
                </Tooltip>
            </Group>
        </Group>
    );
}

function Results( { evaluated, setEvaluated, maximized, execute }: EvalProps ) {
    const { primaryResults, initActions, finalActions, columns, id } = evaluated;
    const [viewing, view] = useState<{name: string, open: string, actions: actionResult[]}|undefined>();
    const [q, Q] = useState<string>("");
    const [s, S] = useState<string|undefined>(undefined);
    const [e, E] = useState<number>(1);
    const [w, W] = useState<number>(2);
    const [pp, PP] = useState<number>(defaultPage);
    const [c, { toggle: C }] = useDisclosure(false);
    const [exporting, setExporting] = useState<string|undefined>(undefined);

    const errorCount  = useMemo(()=>primaryResults.filter(r=>r.error).length, [ primaryResults ]);
    const warnCount  = useMemo(()=>primaryResults.filter(r=>r.warn).length, [ primaryResults ]);
    const errorFilter  = useMemo(()=>e===0?primaryResults.filter(r=>!r.error):primaryResults, [ primaryResults, e ]);
    const warnFilter  = useMemo(()=>w===0?errorFilter.filter(r=>!r.warn):errorFilter, [ errorFilter, w ]);
    const searchFilter  = useMemo(()=>q?warnFilter.filter(r=>find(q, r, !c, r.columns.map(c=>c.value))):warnFilter, [ warnFilter, q, c, columns ]);
    const sortFilter = useMemo(()=>{ switch (s) {
        case undefined: return searchFilter;
        case "Errors": return [...searchFilter].sort((a, b)=>Number(b.error) - Number(a.error));
        case "Warns": return [...searchFilter].sort((a, b)=>Number(b.warn) - Number(a.warn));
        case "Actions": return [...searchFilter].sort((a, b)=>a.actions.length - b.actions.length);
        default: return [...searchFilter].sort((a, b)=>(a.columns.find(c=>c.name===s)?.value||"").localeCompare(b.columns.find(c=>c.name===s)?.value||"") )
    }},[ searchFilter, s ]);
    const filtered  = sortFilter;
    const filteredCount  = filtered.length;
    
    const total = Math.ceil(filtered.length / Number(pp));
    const pagination = usePagination({ total, initialPage: 1 });
    const paginated = useMemo(()=>pp === 0 ? filtered : filtered.slice((pagination.active-1)*Number(pp), pagination.active*Number(pp)), [ pp, filtered, pagination ]);

    const exportCSV = () => {
        const someChecked = filtered.some(r => r.checked);
        const csv_rows = someChecked ? filtered.filter(r=>r.checked) : filtered;
        const csv_data = csv_rows.map(e=>`${e.id},${e.columns.map(c=>c.value).join(",")}`).join("\n");
        const csv = `${id||'ID'},${columns.join(",")}\n${csv_data}`;
        setExporting(csv);
    }

    return (<>
    <Exporter title="Export Results" filename="export.csv" data={exporting} close={()=>setExporting(undefined)} />
    <ActionExplorer viewing={viewing} view={view} />
    <ActionMap actions={initActions} view={view} name="Init Actions" />
    {primaryResults.length<=0&&(execute?
    <Notification mt="xs" mb="xs" withCloseButton={false} color="blue">No iterative actions performed.</Notification>:
    <Notification mt="xs" mb="xs" icon={<IconQuestionMark size={20} />} withCloseButton={false} color="blue" title="None Found">No entries match the set conditions.</Notification>)}
    {primaryResults.length>0&&<>
    <Header q={q} e={e} w={w} c={c} Q={Q} E={E} W={W} C={C} s={s} S={S}
    eC={errorCount} wC={warnCount} fC={filteredCount} p={{...pagination, total, perPage: pp }} PP={PP}
    cols={columns} exp={exportCSV} id={id}
    />
    <Divider mt="xs" />
    <TableData p={paginated} c={columns} dE={e<2} dW={w<2} v={view} sE={setEvaluated} pR={primaryResults} max={maximized||false} id={id} /></>}
    <ActionMap actions={finalActions} view={view} name="Final Actions" />
    </>
    )
}

export default function Evaluate( { evaluated, setEvaluated, loading, maximized, error, execute }: EvalProps ) {
    if (loading) return <Status run={execute} />;
    if (error) return <Notification mt="xs" icon={<IconX size={20} />} withCloseButton={false} color="red" title="Error">{error}</Notification>
    return <Results evaluated={evaluated} setEvaluated={setEvaluated} maximized={maximized} execute={execute} />
}
