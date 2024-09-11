import { Center, Paper, Grid, Box, Title, BackgroundImage, Group, CloseButton, Text, Loader, Container, Anchor, LoadingOverlay, ScrollArea, Badge, SimpleGrid, Table } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { AreaChart } from '@mantine/charts';
import useAPI from "../../hooks/useAPI";
import { Link } from "wouter";
import { colors, events } from "../Logs/Logs";
import { IconListSearch, IconRun } from "@tabler/icons-react";
import { useMemo } from "react";
import { useLoader, useSelector } from "../../hooks/redux";
import { getSchemas } from "../../providers/appSlice";
import '@mantine/charts/styles.css';

//REVIEW - Idea: Add custom run buttons, each button has settings such as ask for a prompt, preset conditions which can use a template from the prompt
// button then executes the customised rule.

function Welcome() {
  const [welcome, setWelcome] = useLocalStorage({ key: 'welcome', defaultValue: 'true' });
  const close = () => setWelcome("false");
  if (welcome==="false") return "";
  return (
  <Center pb="lg" >
      <Paper miw={"50%"} h={256} shadow="xl" p={0}
      style={{background:"linear-gradient(250.38deg, rgb(31, 34, 35) 2.39%, rgb(0, 68, 141) 34.42%, rgb(0, 79, 191) 60.95%, rgb(7, 70, 174) 84.83%, rgb(0, 35, 112) 104.37%)"}}>
      <Grid grow justify="center" gutter={0} align="stretch">
          <Grid.Col span={6}>
              <Box m="xl" >
                  <Title c="white" >Welcome to PlatySync</Title>
                  <Text c="white">PlatySync is an application which takes data input, such as a CSV file, and execute actions based on conditions.</Text>
              </Box>
          </Grid.Col>
          <Grid.Col span={6}>
              <BackgroundImage src={'/logo.png'} h={256} >
                  <Group justify="flex-end"><CloseButton onClick={close} m="xs" /></Group>
              </BackgroundImage>
          </Grid.Col>
      </Grid>
      </Paper>
  </Center>
  )
}

function Stat({ title, number, desc, icon, loading }: { title: string, number: number|string, desc: string, icon: JSX.Element, loading?: boolean }) {
  return (
  <Paper withBorder p="lg" miw={300} >
      <Group justify="space-between"><Text>{title}</Text>{icon}</Group>
      {loading?<Loader type="dots" />:<Title size="h3" >{number}</Title>}
      <Text size="xs" c="dimmed">{desc}</Text>
  </Paper>
  )
}

interface TransformedData {
  timestamp: string;
  Evaluated: number;
  Executed: number;
  Errors: number;
}

function Chart({}) {
  const { data, loading } = useAPI<Log[]>({
      url: `/log/history?level=all&limit=1000`,
      default: [], fetch: true,
  });
  const chart = useMemo(()=>Object.values(data.reduce((acc: Record<string, TransformedData>, log) => {
    const date = new Date(log.timestamp).toLocaleDateString();
    const logType = log.message.includes("evaluat") ? "Evaluated" : log.message.includes("execut") ? "Executed" : "Errors";
    if (!acc[date]) acc[date] = { timestamp: date, "Evaluated": 0, "Executed": 0, "Errors": 0 };
    acc[date][logType] += 1;
    return acc;
  }, {})), [ data ]);

  return (
  <SimpleGrid cols={2}>
      <Paper withBorder p="lg" miw={300} h={350} pos="relative" >
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 1 }} />
        <AreaChart
          h={300}
          data={chart}
          dataKey="timestamp"
          series={[
            { name: 'Evaluated', color: 'indigo.6' },
            { name: 'Executed', color: 'lime.6' },
            { name: 'Errors', color: 'red.6' },
          ]}
          curveType="natural"
          gridAxis="none"
          withLegend
        />
      </Paper>
    <Paper withBorder p="lg" h={350} >
    <Group justify="space-between">
        <Text>Event Log</Text>
        <Anchor href="/logs" component={Link}>See All</Anchor>
    </Group>
    <ScrollArea h={273}>
      {data.splice(0, 50).map(log=>{
      const logType = log.message.includes("Evaluating") ? "evaluate" : log.message.includes("Executing") ? "execute" : log.level==="error" ? "error" : undefined;
      const Icon = logType && events[logType];
      return <Badge key={log.timestamp} mb={1} fullWidth variant="light" radius="xs"
      leftSection={Icon&&<Icon size={15} />}
      styles={{root:{display: 'flex',justifyContent: 'flex-start',width: '100%',paddingLeft: '0.5rem'}}}
      color={colors[log.level]} >
        <Text size="sm" truncate="end">{log.timestamp} | {log.message}</Text>
      </Badge>})}
    </ScrollArea>
    </Paper>
  </SimpleGrid>)
}

function Stats({}) {
  const { data: evaluated, loading: evaluated_loading } = useAPI<number>({
      url: `/log/history?message=eval&count=true&limit=1000&date=${new Date((new Date()).valueOf() - (24 * 60 * 60 * 1000))}`,
      default: 0, fetch: true,
  });
  const { data: executed, loading: executed_loading } = useAPI<number>({
    url: `/log/history?message=exec&count=true&limit=1000&date=${new Date((new Date()).valueOf() - (24 * 60 * 60 * 1000))}`,
    default: 0, fetch: true,
  });
  const { data: evaluated_total, loading: evaluated_total_loading } = useAPI<number>({
      url: `/log/history?message=eval&count=true&limit=9000`,
      default: 0, fetch: true,
  });
  const { data: executed_total, loading: executed_total_loading } = useAPI<number>({
      url: `/log/history?message=exec&count=true&limit=9000`,
      default: 0, fetch: true,
  });
  return (
    <Grid mt="lg" grow columns={20} >
      <Grid.Col span={5}>
        <Stat number={evaluated} icon={<IconListSearch/>} title="Evaluated Today" desc="Rules evaluated today" loading={evaluated_loading} />
      </Grid.Col>
      <Grid.Col span={5}>
        <Stat number={executed} icon={<IconRun/>} title="Executed Today" desc="Rules executed today" loading={executed_loading} />
      </Grid.Col>
      <Grid.Col span={5}>
        <Stat number={evaluated_total} icon={<IconListSearch/>} title="Total Evaluations" desc="Rules evaluated in total" loading={evaluated_total_loading} />
      </Grid.Col>
      <Grid.Col span={5}>
        <Stat number={executed_total} icon={<IconRun/>} title="Total Executions" desc="Rules executed in total" loading={executed_total_loading} />
      </Grid.Col>
    </Grid>
  )
}

function Schemas() {
  const { loadingSchemas } = useLoader();
  const schemas = useSelector(getSchemas);

  return (
    <Paper mt="lg" withBorder>
      <Group m="xs" justify="space-between">
          <Title renderRoot={(props) => <Anchor href="/schemas" component={Link} {...props} />} size="h4" >Schemas</Title>
          {loadingSchemas?<Loader size="sm" type="dots" />:<Text c="dimmed">{schemas.length}</Text>}
      </Group>
      {schemas.length>0&&<Table>
          <Table.Thead>
              <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Connectors</Table.Th>
                  <Table.Th>Rules</Table.Th>
              </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
              {schemas.map(({name, connectors, rules})=>
              <Table.Tr key={name}>
                  <Table.Td>{name}</Table.Td>
                  <Table.Td>{(connectors||[]).length}</Table.Td>
                  <Table.Td>{(rules||[]).length}</Table.Td>
              </Table.Tr>)}
          </Table.Tbody>
      </Table>}
    </Paper>
  )
}

export default function Home() {
  return (
    <Container fluid mt="xs" >
      <Welcome/>
      <Chart/>
      <Stats/>
      <Schemas/>
    </Container>
  )
}
