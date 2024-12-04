import { Container, Group, Title, Button, Paper, Tabs, ActionIcon, Badge, Box, Code, Indicator, List, Modal, Select, Table, TextInput, Text } from '@mantine/core';
import { IconRefresh, IconTrash, IconSearch, IconDots } from '@tabler/icons-react';
import { ReactElement, useEffect, useState } from 'react';
import useAPI from '../../hooks/useAPI';
import { modals } from '@mantine/modals';
import { DatePickerInput } from '@mantine/dates';
import { useViewportSize } from '@mantine/hooks';
import Wrapper from '../../components/Wrapper';
import Evaluate from '../../components/Run/Evaluate';
import Concealer from '../../components/Concealer';
import { colors } from '../../modules/common';

const limits = [ 1000, 500, 100, 50, 20, 10 ];
const limitData = limits.map(l=>({ value: String(l), label: `limit: ${l}` }));

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
  const { width } = useViewportSize();
  const [date, setDate] = useState<[Date | null, Date | null]>([null, null]);
  const [level, setLevel] = useState<string | null>('all');
  const [limit, setLimit] = useState<string | null>('50');
  const [query, search] = useState<string>('');
  const [viewing, setViewing] = useState<log|undefined>(undefined);
  const { data: logs, fetch, del, loading } = useAPI<log[]>({
      url: `/log/${endpoint}?level=${level}&limit=${limit}${!date[0]?'':`&date=${String(date[0])}${!date[1]?'':`,${String(date[1])}`}`}`,
      default: [],
  });
  const filtered = (logs||[]).filter(log=>find(query, log));
  useEffect(()=>{ fetch() },[ date, level, limit ]);
  const [evaluated, setEvaluated] = useState<response>({ primaryResults: [], initActions: [], finalActions: [], columns: [] });
  const view = (log?: log) => {
    setViewing(log);
    if (!log || !log.results) return setEvaluated({ primaryResults: [], initActions: [], finalActions: [], columns: [] });
    setEvaluated(log.results as unknown as response);
  }
  const clear = () =>
    modals.openConfirmModal({
        title: 'Clear log?',
        centered: true,
        children: (
        <Text size="sm">
            Are you sure you want to empty the {endpoint} log?<br/>
            This action is destructive and cannot be reversed.<br/>
        </Text>
        ),
        labels: { confirm: 'Reset', cancel: "No, don't clear" },
        confirmProps: { color: 'red' },
        onConfirm: () => del(),
  });

  return (<>
  <Paper mt="lg" mb="xs" pl="xl" pr="xl" >
    <Modal size="auto" opened={!!viewing} onClose={()=>(view(undefined))} title="Log Viewer">
        {viewing&&
        <Box>
          <List>
            <List.Item>level: <Code c={colors[viewing.level]} >{viewing.level}</Code></List.Item>
            <List.Item>timestamp: <Code>{viewing.timestamp}</Code></List.Item>
            <List.Item>message: <Code>{viewing.message}</Code></List.Item>
            {viewing.schema&&<List.Item>schema: <Code>{viewing.schema}</Code></List.Item>}
            {viewing.rule&&<List.Item>rule: <Code>{viewing.rule}</Code></List.Item>}
          </List>
          <Concealer fz="xs" label='Raw Output' >
                <pre style={{margin:0}} ><Code fz="xs" >{JSON.stringify(viewing, null, 2)}</Code></pre>
          </Concealer>
          {viewing.stack&&
          <Box mt="xs" >
            <Title size="h4">Error Stack</Title>
            <Code c="red">{viewing.stack}</Code>
          </Box>}
          {viewing.results&&<Evaluate evaluated={evaluated} setEvaluated={setEvaluated} />}
        </Box>}
    </Modal>
    <Group justify="space-between">
      <Button onClick={()=>fetch()}
      variant="subtle" loading={loading}
      size="xs"
      leftSection={<IconRefresh stroke={1.5} size={16}/>}
      >refresh</Button>
      <Button color="red" onClick={()=>clear()}
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
  <Table highlightOnHover stickyHeader>
    <Table.Thead>
      <Table.Tr>
        <Table.Th w={"32px"} />
        <Table.Th w={"128px"}>Level</Table.Th>
        <Table.Th w={"200px"} >Time</Table.Th>
        <Table.Th>Message</Table.Th>
        {extraTh}
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {filtered.map((log, key)=> {
        let message = <Text>{log.message}</Text>;
        if (log.message.includes("Rule evaluating")) message = <Text c="indigo" >{log.message}</Text>;
        if (log.message.includes("Rule executing")) message = <Text c="green" >{log.message}</Text>;
        if (log.message.includes("Rule concluded")) message = <Text c="blue" >{log.message}</Text>;
        if (log.stack) message = <Text c="red" >{log.message}</Text>;
        return <Table.Tr key={key} >
          <Table.Td><ActionIcon onClick={()=>view(log)} variant="subtle" color="gray"><IconDots size={16} stroke={1.5} /></ActionIcon></Table.Td>
          <Table.Td>
            <Indicator disabled={!log.stack&&!log.results} color={log.stack?'red':undefined} >
              <Badge radius="xs" color={colors[log.level]} fullWidth variant="light">{log.level}</Badge>
            </Indicator>
          </Table.Td>
          <Table.Td><Text size="sm" truncate="end">{log.timestamp}</Text></Table.Td>
          <Table.Td maw={width/2} ><Text size="sm" truncate="end">{message}</Text></Table.Td>
          {extraTd&&extraTd(log, endpoint)}
        </Table.Tr>
      })}
    </Table.Tbody>
  </Table></>)
}

export default function Logs() {
    const [activeTab, setActiveTab] = useState<string | null>('general');
    return (
    <Container size="90%">
        <Group justify="space-between">
            <Title mb="xs" >Log Browser</Title>
        </Group>
        <Wrapper>
            <Paper mb="xs" p="xs" >
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
                        extraTd={(log)=><><Table.Td><Badge radius="xs" variant="light">{log.schema}</Badge></Table.Td><Table.Td><Badge radius="xs" variant="light" color="orange">{log.rule}</Badge></Table.Td></>}
                        />
                    </Tabs.Panel>
                </Tabs>
            </Paper>
        </Wrapper>
    </Container>
    )
}
