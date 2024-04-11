import { ActionIcon, Box, Checkbox, Collapse, Divider, Group, Menu, Pagination, Table, TextInput, Text, useMantineTheme, Indicator, Tooltip, Notification } from "@mantine/core";
import { useDisclosure, usePagination } from "@mantine/hooks";
import { IconHandStop, IconLetterCase, IconMenu2, IconQuestionMark, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { availableActions } from "../../../modules/common";
import ActionExplorer from "./ActionExplorer";

function find(query: string, r: evaluated, caseSen: boolean){
    if (caseSen?r.id.toLowerCase().includes(query):r.id.includes(query)) return true;
    if (r.display&&(caseSen?r.display.toLowerCase().includes(query):r.display.includes(query))) return true;
    return false;
}

function downloadCSV(filename: string, text: string) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

interface Head {
    count: number;
    total: number;
    perPage: number;
    limit: (limit: number)=>void;
    pagination: { active: number, setPage: (pageNumber: number) => void };
    sort: (type: string)=>void;
    sorting: string;
    query: string;
    search: (query: string) => void;
    filters: {[k: string]: boolean};
    toggles: {[k: string]: () => void}
    setCase: () => void;
    caseSen: boolean;
    checked: evaluated[];
}
function Head( { total, limit, perPage, pagination, count, sort, sorting, query, search, filters, toggles, caseSen, setCase, checked }: Head ) {
    const [o1, { toggle: t1 }] = useDisclosure(false);
    const [o2, { toggle: t2 }] = useDisclosure(false);
    const [o3, { toggle: t3 }] = useDisclosure(false);
    const [o4, { toggle: t4 }] = useDisclosure(false);
    const filtered = (p: string, c?: string) => ({ onClick: ()=>toggles[p](), color: filters[p]?c:"gray" });
    const sorted = (p: string) => ({ onClick: ()=>sort(p), color: sorting===p?"gray":undefined });
    const page = (p: number) => ({ onClick: ()=>limit(p), color: perPage===p?"gray":undefined });
    const csv_data = useMemo(()=>checked.map(e=>`${e.id},${e.display||e.id}`).join("\n"), [ checked ]);
    const csv = `id,display\n${csv_data}`;
    return (
    <Group justify="space-between" miw="600px" >
        <TextInput
        placeholder={`Search ${count} entries`}
        leftSection={<IconSearch size={16} stroke={1.5} />}
        visibleFrom="xs"
        value={query}
        onChange={(event)=>search(event.currentTarget.value)}
        rightSection={<ActionIcon variant={caseSen?"subtle":"light"} onClick={setCase} color="gray" size={24}><IconLetterCase size={18} /></ActionIcon>}
        />
        {(perPage>0&&total>1)&&<Pagination total={total} onChange={(value)=>pagination.setPage(value)} value={pagination.active} />}
        <Menu shadow="md" position="bottom-end" width={200}>
            <Menu.Target>
                <ActionIcon color="gray" variant="subtle"><IconMenu2 /></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label onClick={t1} style={{cursor:"pointer"}} >Filtering</Menu.Label>
                <Collapse in={o1}>
                    <Menu.Item {...filtered('showErrors')} >Show Errors</Menu.Item>
                    {filters['showErrors']&&<Menu.Item {...filtered('enableErrors', 'red')} >Errors {filters['enableErrors']?'Enabled':'Disabled'}</Menu.Item>}
                    <Menu.Item {...filtered('showWarns')} >Show Warnings</Menu.Item>
                    <Menu.Item {...filtered('enableWarns', 'orange')} >Warnings {filters['enableWarns']?'Enabled':'Disabled'}</Menu.Item>
                </Collapse>
                <Menu.Label onClick={t2} style={{cursor:"pointer"}} >Sorting</Menu.Label>
                <Collapse in={o2}>
                    <Menu.Item {...sorted('id')} >By ID</Menu.Item>
                    <Menu.Item {...sorted('display')} >By Display Name</Menu.Item>
                </Collapse>
                <Menu.Label onClick={t3} style={{cursor:"pointer"}} >Pagination</Menu.Label>
                <Collapse in={o3}>
                    <Menu.Item {...page(10)} >10 Per Page</Menu.Item>
                    <Menu.Item {...page(25)} >25 Per Page</Menu.Item>
                    <Menu.Item {...page(50)} >50 Per Page</Menu.Item>
                    <Menu.Item {...page(100)} >100 Per Page</Menu.Item>
                    <Menu.Item {...page(0)} >No Pagination</Menu.Item>
                </Collapse>
                <Menu.Label onClick={t4} style={{cursor:"pointer"}} >Export</Menu.Label>
                <Collapse in={o4}>
                    <Menu.Item disabled={checked.length<=0} onClick={()=>downloadCSV("results.csv", csv)} >Checked CSV</Menu.Item>
                </Collapse>
            </Menu.Dropdown>
        </Menu>
    </Group>
    )
}

function IconMap({ actions, size = 16, click }: { actions: action[], size?: number, click?: (open: string)=> () => void }){
    const theme = useMantineTheme();
    return actions.map((action,key)=>{
        const act = availableActions.find(a=>a.id===action.name);
        if (!act) return <></>;
        const problem = action.result.error || action.result.warn;
        const col = !problem ? act.color?theme.colors[act.color][6]:undefined : theme.colors.gray[8];
        return <Tooltip key={key} fz="xs" withArrow label={action.name}>
        <Indicator disabled={!problem} size={size/3} offset={3} color={action.result.warn?'orange':'red'} inline>
            <act.Icon onClick={click&&click(key.toString())} style={{cursor:"pointer"}} color={col} size={size} stroke={2} />
        </Indicator></Tooltip>
    })
}

function ActionMap({ actions, view }: { actions: action[], view: (id: {name: string, open: string, actions: action[]}) => void }){
    const click = (open: string) => () => view({name: 'Init', open, actions });
    return actions.length<=0?<Divider />:
    <Divider label={<Group><IconMap actions={actions} size={22} click={click} /></Group>} />
}

interface Row { executed?: boolean, row: evaluated, filters: {[k: string]: boolean}, check: (id: string) => () => void, view: (id: {name: string, open: string, actions: action[]}) => void }
function Row( { row, check, view, filters, executed }: Row ) {
    const click = (open: string) => () => view({name: row.display||row.id, open, actions: row.actions });
    const errors = row.actions.filter(t=>t.result.error).length > 0;
    const warns = row.actions.filter(t=>t.result.warn).length > 0;
    const disabled = (errors && !filters['enableErrors']) || (warns && !filters['enableWarns']);
    //filters['showErrors']||filters['showWarns'];
    const color = errors ? "red" : warns ? "orange" : undefined;
    const c = disabled ? "dimmed" : undefined;
    return (
    <Table.Tr key={row.id} bg={row.checked ? 'var(--mantine-color-blue-light)' : undefined} >
        {!executed&&<Table.Td><Checkbox color={color} disabled={disabled} onChange={check(row.id)} checked={row.checked} /></Table.Td>}
        <Table.Td c={c} >{row.id}</Table.Td>
        <Table.Td c={c} >{row.display||row.id}</Table.Td>
        <Table.Td><IconMap actions={row.actions} click={click} /></Table.Td>
    </Table.Tr>
    )
}

interface EvalProps {
    evaluated: evaluated[];
    setEvaluated: (data: React.SetStateAction<response>) => void;
    initActions: action[];
    finalActions: action[];
    executed?: boolean;
}
export default function Evaluate( { evaluated, setEvaluated, initActions = [], finalActions = [], executed }: EvalProps ) {
    const [showErrors, { toggle: s1 }] = useDisclosure(executed||false);
    const [showWarns, { toggle: s2 }] = useDisclosure(true);
    const [enableErrors, { toggle: e1 }] = useDisclosure(false);
    const [enableWarns, { toggle: e2 }] = useDisclosure(true);
    const filters = { showErrors, showWarns, enableErrors, enableWarns };
    const toggles = { showErrors: s1, showWarns: s2, enableErrors: e1, enableWarns: e2 };

    const [caseSen, { toggle: setCase }] = useDisclosure(true);
    const [viewing, view] = useState<{name: string, open: string, actions: action[]}|undefined>();
    const [sorting, setSort] = useState<string>("none");
    const [query, search] = useState<string>("");
    const sort = (sorting: string) => {
        setSort(sorting);
        setEvaluated((e) => ({...e, evaluated: e.evaluated.sort((a, b) => {
            if (sorting==="display") return (a.display||a.id).localeCompare(b.display||b.id);
            return a.id.localeCompare(b.id);
        })}) );
    };
    const check = (id: string) => () => { setEvaluated((e) => ({...e, evaluated: e.evaluated.map(r=>r.id!==id?r:{...r, checked: !r.checked})}) ); };
    const checked = useMemo(()=>evaluated.filter(r=>r.checked), [ evaluated ]);
    const checkedCount = checked.length;
    const checkAll = () => setEvaluated((e) => ({ ...e,
        evaluated: e.evaluated.map(r=>{
            const rc = {...r, checked: checkedCount==0};
            const errors = r.actions.filter(t=>t.result.error).length > 0;
            const warns = r.actions.filter(t=>t.result.warn).length > 0;
            if ((!enableErrors||!showErrors) && errors) rc.checked = false;
            if ((!enableWarns||!showWarns) && warns) rc.checked = false;
            if (query!=='') rc.checked = !find(caseSen?query.toLowerCase():query, r, caseSen) ? false : rc.checked;
            return rc;
        })
    }));
    const cleaned = useMemo(()=> evaluated.filter(r=>{
        const errors = r.actions.filter(t=>t.result.error).length > 0;
        const warns = r.actions.filter(t=>t.result.warn).length > 0;
        if (!showErrors && errors) return false;
        if (!showWarns && warns) return false;
        return true;
    }), [ evaluated, filters ]);
    
    const [perPage, limit] = useState<number>(50);
    const filtered = query==='' ? cleaned : cleaned.filter((r)=>find(caseSen?query.toLowerCase():query, r, caseSen));
    const total = Math.ceil(filtered.length / Number(perPage));
    const pagination = usePagination({ total, initialPage: 1 });
    const paginated = perPage === 0 ? filtered : filtered.slice((pagination.active-1)*Number(perPage), pagination.active*Number(perPage));
    const initErrors = initActions.filter(a=>a.result.error).length > 0;
    return (
    <Box>
        <ActionExplorer viewing={viewing} view={view} />
        <ActionMap actions={initActions} view={view}  />
        {initErrors&&<Notification icon={<IconHandStop size={20} />} withCloseButton={false} color="orange" title="Evaluation Halted">Initial actions contained an error.</Notification>}
        {evaluated.length===0?<Notification icon={<IconQuestionMark size={20} />} withCloseButton={false} color="blue" title="None Found">No entries match the set conditions.</Notification>:
        <Box pt={initActions.length===0?"xs":undefined} >
            <Head caseSen={caseSen}
            setCase={setCase}
            pagination={pagination}
            total={total}
            limit={limit}
            perPage={perPage}
            count={filtered.length}
            sort={sort}
            sorting={sorting}
            query={query}
            search={search}
            filters={filters}
            toggles={toggles}
            checked={checked}
            />
            <Divider mt="xs"/>
            {filtered.length===0?<Text ta="center" mt="sm" >No entries found.</Text>:
            <Table stickyHeader >
                <Table.Thead>
                    <Table.Tr>
                        {!executed&&<Table.Th><Checkbox onChange={checkAll} checked={checkedCount > 0} /></Table.Th>}
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Display</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{(paginated||[]).map((row) =><Row key={row.id} row={row} check={check} view={view} filters={filters} executed={executed} />)}</Table.Tbody>
            </Table>}
            <ActionMap actions={finalActions} view={view}  />
        </Box>}
    </Box>
    )
}
