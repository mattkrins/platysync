import { Center, Grid, Paper, Title, Text, Box, BackgroundImage, Group, CloseButton, Container, Table, Loader, Anchor } from "@mantine/core";
import { IconListSearch, IconRun } from "@tabler/icons-react";
import useAPI from "../../hooks/useAPI";
import cronstrue from "cronstrue";
import { useLocalStorage } from "@mantine/hooks";
import { useContext } from "react";
import AppContext from "../../providers/AppContext";

function Welcome() {
    const [welcome, setWelcome] = useLocalStorage({ key: 'welcome', defaultValue: 'true' });
    const close = () => setWelcome("false");
    if (welcome==="false") return "";
    return (
    <Center>
        <Paper miw={"50%"} h={256} shadow="xl" p={0}
        style={{background:"linear-gradient(250.38deg, rgb(31, 34, 35) 2.39%, rgb(0, 68, 141) 34.42%, rgb(0, 79, 191) 60.95%, rgb(7, 70, 174) 84.83%, rgb(0, 35, 112) 104.37%)"}}>
        <Grid grow justify="center" gutter={0} align="stretch">
            <Grid.Col span={6}>
                <Box m="xl" >
                    <Title>Welcome to PlatySync</Title>
                    <Text>PlatySync is an application which takes data input, such as a CSV file, and execute actions based on conditions.</Text>
                </Box>
            </Grid.Col>
            <Grid.Col span={6}>
                <BackgroundImage src={'/logo512.png'} h={256} >
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

interface dashboardResponse {
    evaluatedToday: number;
    executedToday: number;
    totalEvaluations: number;
    totalExecutions: number;
    schemas: { name: string, connectors: number, rules: number}[];
    schedules: schedule[];
    users: user[];
}

export default function Dashboard() {
    const { changeNav } = useContext(AppContext);
    const { data, loading } = useAPI<dashboardResponse>({
        url: "/dashboard",
        fetch: true,
        default: {
            evaluatedToday: 0,
            executedToday: 0,
            totalEvaluations: 0,
            totalExecutions: 0,
            schemas: [],
            schedules: [],
            users: [],
        },
    });
    return (
    <Box>
        <Welcome/>
        <Container fluid mt="lg" >
        <Grid grow columns={20} >
            <Grid.Col span={5}><Stat loading={loading} title="Evaluated Today" number={data.evaluatedToday} desc="Rules evaluated today" icon={<IconListSearch/>} /></Grid.Col>
            <Grid.Col span={5}><Stat loading={loading} title="Executed Today" number={data.executedToday} desc="Rules executed today" icon={<IconRun/>} /></Grid.Col>
            <Grid.Col span={5}><Stat loading={loading} title="Total Evaluations" number={data.totalEvaluations} desc="Rules evaluated in total" icon={<IconListSearch/>} /></Grid.Col>
            <Grid.Col span={5}><Stat loading={loading} title="Total Executions" number={data.totalExecutions} desc="Rules executed in total" icon={<IconRun/>} /></Grid.Col>
        </Grid>
        </Container>
        <Grid p="md" grow >
            <Grid.Col span={4}><Paper withBorder>
                <Group m="xs" justify="space-between">
                    <Title size="h4" >Schemas</Title>
                    {loading?<Loader size="sm" type="dots" />:<Text c="dimmed">{data.schemas.length}</Text>}
                </Group>
                {data.schemas.length>0&&<Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Connectors</Table.Th>
                            <Table.Th>Rules</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {data.schemas.map(({name, connectors, rules})=>
                        <Table.Tr key={name}>
                            <Table.Td>{name}</Table.Td>
                            <Table.Td>{connectors}</Table.Td>
                            <Table.Td>{rules}</Table.Td>
                        </Table.Tr>)}
                    </Table.Tbody>
                </Table>}
            </Paper></Grid.Col>
            <Grid.Col span={4}><Paper withBorder>
                <Group m="xs" justify="space-between">
                    <Title renderRoot={(props) => <Anchor onClick={()=>changeNav("Schedules")} {...props} />} size="h4" >Schedules</Title>
                    {loading?<Loader size="sm" type="dots" />:<Text c="dimmed">{data.schedules.length}</Text>}
                </Group>
                {data.schedules.length>0&&<Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Schema</Table.Th>
                            <Table.Th>Runs</Table.Th>
                            <Table.Th>Rules</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {data.schedules.map((item, key)=>{
                        const display = item.type==="cron" ? cronstrue.toString(item.value, { throwExceptionOnParseError: false }) : "On file change";
                        return <Table.Tr key={key} >
                            <Table.Td>{item.schema}</Table.Td>
                            <Table.Td>{display}</Table.Td>
                            <Table.Td>{Number(item.rules) > 0 ? item.rules : "All" }</Table.Td>
                        </Table.Tr>})}
                    </Table.Tbody>
                </Table>}
            </Paper></Grid.Col>
            <Grid.Col span={4}><Paper withBorder>
                <Group m="xs" justify="space-between">
                    <Title renderRoot={(props) => <Anchor onClick={()=>changeNav("Users")} {...props} />} size="h4" >Users</Title>
                    {loading?<Loader size="sm" type="dots" />:<Text c="dimmed">{data.users.length}</Text>}
                </Group>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Username</Table.Th>
                            <Table.Th>Group</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {data.users.map(({username, group, enabled})=>
                        <Table.Tr key={username}>
                            <Table.Td>{enabled?username:<Text c="dimmed" td="line-through">{username}</Text>}</Table.Td>
                            <Table.Td>{group}</Table.Td>
                        </Table.Tr>)}
                    </Table.Tbody>
                </Table>
            </Paper></Grid.Col>
        </Grid>
    </Box>
    )
}
