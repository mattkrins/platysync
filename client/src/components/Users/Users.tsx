import { ActionIcon, Badge, Button, Grid, Group, Modal, Paper, Switch, Tooltip } from "@mantine/core";
import { IconAlertCircle, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import Container from "../Common/Container";
import Head from "../Common/Head";
import useAPI from "../../hooks/useAPI";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import Editor from "./Editor";

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
  const admin = (item.group||"") == "admin";
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
                    <Switch onClick={()=>toggle()} disabled={loading||(admins<=1&&admin)} checked={item.enabled} color="teal" />
                    <ActionIcon onClick={()=>edit()} disabled={disabled} variant="subtle" color="orange">
                        <IconPencil size={16} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={()=>remove()} disabled={disabled||(admins<=1&&admin)} variant="subtle" color="red">
                        <IconTrash size={16} stroke={1.5} />
                    </ActionIcon>
                </Group>
          </Grid.Col>
      </Grid>
  </Paper>)
}

export default function Users() {
  const [ editing, edit ] = useState<user|undefined>(undefined);
  const [ adding, { open, close } ] = useDisclosure(false);
  const add = ()=> { edit({ stats: false } as unknown as user); open() };

  const { data: users, loading, setData, fetch: refresh, loaders: l1, errors: e1 } = useAPI<user[]>({
      url: `/user`,
      default: [],
      fetch: true,
      preserve: true,
  });

  const { put: toggle, loaders: l2, errors: e2 } = useAPI({
      url: `/user/toggle`,
      check: o => { setData(sx=>sx.map(s=>(o.key===s.username?{...s, enabled: !s.enabled }:s))) },
      finally: () => refresh(),
  });

  const { del: remove, loaders: l3, errors: e3 } = useAPI({
      url: `/user`,
      check: o => { setData(sx=>sx.filter(s=>o.key!==s.username)) },
      finally: () => refresh(),
  });

  const admins = users.filter(u=>u.group==="admin").length;
  const loaders = { ...l1, ...l2, ...l3, };
  const errors = { ...e1, ...e2, ...e3, };

  return (
    <Container label={<Head rightSection={<Button onClick={()=>add()} leftSection={<IconPlus size={16} />} loading={loading} variant="light">Add</Button>} >User Manager</Head>} >
      <Modal opened={!!editing} onClose={()=>{edit(undefined); close();}} title={adding?'Add User':'Edit User'}>
          {editing&&<Editor editing={editing} close={()=>{edit(undefined); close();}} adding={adding} refresh={refresh} admins={admins} />}
      </Modal>
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
            toggle={()=>toggle({data: { username: item.username}, key: item.username})}
            remove={()=>remove({data: { username: item.username}, key: item.username})}
            edit={()=>edit(item)}
            />
      )})}
    </Container>
  )
}
