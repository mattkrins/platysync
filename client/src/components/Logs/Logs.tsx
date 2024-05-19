import { Container, Button, Paper, Table, Badge, Tabs, Select, TextInput, Group } from "@mantine/core";
import { DatePickerInput } from '@mantine/dates';
import Head from "../Common/Head";
import useAPI from "../../hooks/useAPI";
import { ReactElement, useEffect, useState } from "react";
import classes from '../../Theme.module.css';
import { IconRefresh, IconSearch, IconTrash } from "@tabler/icons-react";

const colors: {[color: string]: string} = {
  silly: 'indigo',
  debug: 'blue',
  verbose: 'cyan',
  http: 'green',
  info: 'lime',
  warn: 'orange',
  error: 'red',
}

const limits = [ 1000, 500, 100, 50, 20, 10 ];
const limitData = limits.map(l=>({ value: String(l), label: `limit: ${l}` }))

interface log {
  timestamp: string;
  level: string;
  message: string;
  [k: string]: string;
}

interface Generic {
  endpoint: string;
  extraTh?: ReactElement;
  extraTd?(log: log, endpoint: string): ReactElement;
  extraButtons?(endpoint: string): ReactElement;
  extraFilters?(endpoint: string): ReactElement;
}

function find(query: string = "", log: log){
  return Object.values(log).join(" ").toLowerCase().includes(query.toLowerCase());
}

function Generic( { endpoint, extraTh, extraTd, extraButtons, extraFilters }: Generic ) {
  const [date, setDate] = useState<[Date | null, Date | null]>([null, null]);
  const [level, setLevel] = useState<string | null>('all');
  const [limit, setLimit] = useState<string | null>('50');
  const [query, search] = useState<string>('');
  const { data: logs, fetch, del, loading } = useAPI<log[]>({
      url: `/log/${endpoint}?level=${level}&limit=${limit}${!date[0]?'':`&date=${String(date[0])}${!date[1]?'':`,${String(date[1])}`}`}`,
      default: [],
  });
  const filtered = (logs||[]).filter(log=>find(query, log));
  useEffect(()=>{ fetch() },[ date, level, limit ]);
  return (<>
  <Paper mt="lg" mb="xs" pl="xl" pr="xl" >
    <Group justify="space-between">
      <Button onClick={()=>fetch()}
      variant="subtle" loading={loading}
      size="xs"
      leftSection={<IconRefresh stroke={1.5} size={16}/>}
      >refresh</Button>
      <Button color="red" onClick={()=>del()}
      variant="subtle" loading={loading}
      size="xs"
      leftSection={<IconTrash stroke={1.5} size={16}/>}
      >clear</Button>
      {extraButtons&&extraButtons(endpoint)}
      <Select
      data={[ "all", ...Object.keys(colors)]}
      variant="unstyled"
      allowDeselect={false}
      value={level} onChange={setLevel}
      />
      <Select
      data={limitData}
      variant="unstyled"
      allowDeselect={false}
      value={limit} onChange={setLimit}
      />
      {extraFilters&&extraFilters(endpoint)}
      <DatePickerInput
        type="range" miw={220}
        placeholder="Date range"
        value={date}
        onChange={setDate}
        variant="unstyled"
        size="sm" clearable
      />
      <TextInput
      leftSection={<IconSearch size={16}/>}
      placeholder="Search"
      variant="unstyled"
      miw="20%"
      value={query} onChange={e=>search(e.target.value)}
      />
    </Group>
  </Paper>
  <Table stickyHeader>
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Level</Table.Th>
        <Table.Th>Time</Table.Th>
        <Table.Th>Message</Table.Th>
        {extraTh}
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {filtered.map((log, key)=>
        <Table.Tr key={key}>
          <Table.Td><Badge color={colors[log.level]} fullWidth variant="light">{log.level}</Badge></Table.Td>
          <Table.Td>{log.timestamp}</Table.Td>
          <Table.Td>{log.message}</Table.Td>
          {extraTd&&extraTd(log, endpoint)}
        </Table.Tr>
      )}
    </Table.Tbody>
  </Table></>)
}

export default function Logs() {
  const [activeTab, setActiveTab] = useState<string | null>('general');

  return (
    <Container size="100%">
        <Head>Log Browser</Head>
        <Paper className={classes.container} p="xs" >
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="history">History</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">
            <Generic endpoint="general" />
          </Tabs.Panel>
          <Tabs.Panel value="history">
            <Generic endpoint="history"
            extraTh={<><Table.Th>Schema</Table.Th><Table.Th>Rule</Table.Th></>}
            extraTd={(log)=><><Table.Td><Badge variant="light">{log.schema}</Badge></Table.Td><Table.Td><Badge variant="light" color="orange">{log.rule}</Badge></Table.Td></>}
            />
          </Tabs.Panel>
        </Tabs>
        </Paper>
    </Container>
  )
}
