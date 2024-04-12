import { ActionIcon, Badge, Button, Grid, Group, Paper, Switch, Tooltip } from "@mantine/core";
import { IconAlertCircle, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import Container from "../Common/Container";
import Head from "../Common/Head";
import useAPI from "../../hooks/useAPI";

function Item( { item, admins, loading, error, toggle, edit, remove }: {
  item: user;
  admins: number;
  loading?: boolean;
  error?: string;
  toggle(): void;
  edit(): void;
  remove(): void;
} ) {
  const disabled = loading;
  return (
  <Paper mb="xs" p="xs" withBorder >
      <Grid justify="space-between"  align="center" >
          <Grid.Col span={1}/>
          <Grid.Col span={3} c={disabled?"dimmed":undefined}>
            <Group><Badge color={item.group==="admin"?"red":undefined} variant="light">{item.group}</Badge></Group>
          </Grid.Col>
          <Grid.Col span={5} c={disabled?"dimmed":undefined}>{item.username}</Grid.Col>
          <Grid.Col span={2}>
                <Group gap="xs" justify="flex-end">
                    {error&&<Tooltip withArrow label={error} w={420} multiline position="top-end" color="red" ><IconAlertCircle size={16} color="red" /></Tooltip>}
                    <Switch onClick={()=>toggle()} disabled={loading||admins<=1} checked={item.enabled} color="teal" />
                    <ActionIcon onClick={()=>edit()} disabled={disabled} variant="subtle" color="orange">
                        <IconPencil size={16} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={()=>remove()} disabled={disabled||admins<=1} variant="subtle" color="red">
                        <IconTrash size={16} stroke={1.5} />
                    </ActionIcon>
                </Group>
          </Grid.Col>
      </Grid>
  </Paper>)
}

export default function Users() {
  const { data: users, loading, setData, fetch: refresh, loaders: l1, errors: e1, setLoaders } = useAPI<user[]>({
      url: `/user`,
      default: [],
      fetch: true,
      preserve: true,
  });

  const admins = users.filter(u=>u.group==="admin").length;

  const loaders = { ...l1 };
  const errors = { ...e1 };

  return (
    <Container label={<Head rightSection={<Button onClick={()=>{}} leftSection={<IconPlus size={16} />} loading={loading} variant="light">Add</Button>} >User Manager</Head>} >
      <Paper mb="xs" p="xs" >
          <Grid justify="space-between">
              <Grid.Col span={1}/>
              <Grid.Col span={3}>Group</Grid.Col>
              <Grid.Col span={5}>Username</Grid.Col>
              <Grid.Col span={2}/>
          </Grid>
      </Paper>
      {users.map((item) => {
          const loading = loaders[item.username];
          const error = errors[item.username];
          return (
            <Item
            key={item.username}
            item={item}
            admins={admins}
            loading={loading}
            error={error}
            />
      )})}
    </Container>
  )
}
