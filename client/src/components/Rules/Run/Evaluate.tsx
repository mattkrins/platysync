import { ActionIcon, Box, Checkbox, Collapse, Divider, Group, Menu, Pagination, Paper, Table, TextInput, Text } from "@mantine/core";
import { useDisclosure, usePagination } from "@mantine/hooks";
import { IconCheckbox, IconEqualNot, IconEye, IconEyeOff, IconMenu2, IconSearch } from "@tabler/icons-react";
import { useState } from "react";

interface evaluated { id: string, display?: string, checked?: boolean }

function find(query: string, r: evaluated){
    if (r.id.includes(query)) return true;
    if (r.display && r.display.includes(query)) return true;
    return false;
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
    display: number;
    setDisplay: (query: number) => void;
}
function Head( { total, limit, perPage, pagination, count, sort, sorting, query, search, display, setDisplay }: Head ) {
    const [o1, { toggle: t1 }] = useDisclosure(false);
    const [o2, { toggle: t2 }] = useDisclosure(false);
    const [o3, { toggle: t3 }] = useDisclosure(false);
    const sorted = (p: string) => ({ onClick: ()=>sort(p), color: sorting===p?"gray":undefined })
    const page = (p: number) => ({ onClick: ()=>limit(p), color: perPage===p?"gray":undefined })
    return (
    <Group justify="space-between" miw="600px" >
        <TextInput
        placeholder={`Search ${count} entries`}
        leftSection={<IconSearch size={16} stroke={1.5} />}
        visibleFrom="xs"
        value={query}
        onChange={(event)=>search(event.currentTarget.value)}
        />
        {perPage>0&&<Pagination total={total} onChange={(value)=>pagination.setPage(value)} value={pagination.active} />}
        <Menu shadow="md" position="bottom-end" width={200}>
            <Menu.Target>
                <ActionIcon color="gray" variant="subtle"><IconMenu2 /></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label onClick={t1} style={{cursor:"pointer"}} >Filtering</Menu.Label>
                <Collapse in={o1}>
                    <Menu.Item onClick={()=>setDisplay(display===0?1:0)} leftSection={display===0?<IconEye size={16} />:<IconEyeOff size={16} />}>{display===0?'Display':'Hide'} Actionless</Menu.Item>
                    {display>0&&<Menu.Item onClick={()=>setDisplay(2)} color="red" leftSection={<IconCheckbox size={16} />}>Enable Actionless</Menu.Item>}
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
            </Menu.Dropdown>
        </Menu>
    </Group>
    )
}

function Row( { row, check }: { row: evaluated, check: (id: string) => () => void } ) {
    return (
    <Table.Tr key={row.id}>
        <Table.Td><Checkbox onChange={check(row.id)} checked={row.checked} /></Table.Td>
        <Table.Td>{row.id}</Table.Td>
        <Table.Td>{row.display||row.id}</Table.Td>
        <Table.Td></Table.Td>
    </Table.Tr>
    )
}

export default function Evaluate( { evaluated, setEvaluated }: { evaluated: evaluated[], setEvaluated: (data: (data: {evaluated: evaluated[]}) => void) => void } ) {
    const [display, setDisplay] = useState<number>(0);
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
    const checkedCount = evaluated.filter(r=>r.checked).length;
    const checkAll = () => { setEvaluated((e) => ({...e, evaluated: e.evaluated.map(r=>({...r, checked: checkedCount===0}))}) ); };
    
    const [perPage, limit] = useState<number>(50);
    const filtered = query==='' ? (evaluated||[]) : (evaluated||[]).filter((r)=>find(query, r));
    const total = Math.ceil(filtered.length / Number(perPage));
    const pagination = usePagination({ total, initialPage: 1 });
    const paginated = perPage === 0 ? filtered : filtered.slice((pagination.active-1)*Number(perPage), pagination.active*Number(perPage));
    
    return ( evaluated.length===0?
    <Paper radius="md" withBorder mt={32} mb={32} p="lg" style={{width:"100%"}} ><Group><IconEqualNot /> <Text>No entries matched.</Text></Group></Paper>:
    <Box>
        <Divider mb="xs"/>
        <Head
        pagination={pagination}
        total={total}
        limit={limit}
        perPage={perPage}
        count={filtered.length}
        sort={sort}
        sorting={sorting}
        query={query}
        search={search}
        display={display}
        setDisplay={setDisplay}
        />
        <Divider mt="xs"/>
        {filtered.length===0?<Text ta="center" mt="sm" >No entries found.</Text>:
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th><Checkbox onChange={checkAll} checked={checkedCount > 0} /></Table.Th>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Display</Table.Th>
                    <Table.Th>Actions</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{(paginated||[]).map((row) =><Row row={row} check={check} />)}</Table.Tbody>
        </Table>}
    </Box>
    )
}
