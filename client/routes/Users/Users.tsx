import { useState } from "react";
import { Container, Group, Title, Button, Paper, Grid, ActionIcon, Tooltip } from "@mantine/core";
import Editor from "./Editor";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import useAPI from "../../hooks/useAPI";
import Wrapper from "../../components/Wrapper";

function User({ user: { username }, edit, refresh }: { user: User, edit(): void, refresh(): void }) {
    const { del, loading: deleting, error } = useAPI<User[]>({
        url: "/user", data: { username },
        then: () => refresh()
    });
    return (
    <Paper mb="xs" p="xs" withBorder >
        <Grid justify="space-between"  align="center" >
            <Grid.Col span={10}>{username}</Grid.Col>
            <Grid.Col span={2}>
                    <Group gap="xs" justify="flex-end">
                        <ActionIcon onClick={edit} variant="subtle" color="orange">
                            <IconPencil size={16} stroke={1.5} />
                        </ActionIcon>
                        <Tooltip label={error} opened={!!error} withArrow position="right" color="red">
                        <ActionIcon onClick={()=>del()} loading={deleting} variant="subtle" color="red">
                            <IconTrash size={16} stroke={1.5} />
                        </ActionIcon>
                        </Tooltip>
                    </Group>
            </Grid.Col>
        </Grid>
    </Paper>)
}


export default function Users() {
    const [ editing, setEditing ] = useState<[User,boolean]|undefined>(undefined);
    const close = () => setEditing(undefined);
    const add = () => setEditing([{ username: "", password: "", confirm: "" },false]);
    const { get: refresh, data: users, loading } = useAPI<User[]>({
        url: "/user", fetch: true,
        default: []
    });
    return (
    <Container>
        <Editor editing={editing} close={close} refresh={refresh}  />
        <Group justify="space-between">
            <Title mb="xs" >User Manager</Title>
            <Button onClick={add} loading={false} leftSection={<IconPlus size={18} />} >Create</Button>
        </Group>
        <Wrapper loading={loading}>
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={10}>Username</Grid.Col>
                    <Grid.Col span={2}/>
                </Grid>
            </Paper>
            {users.map((user) => <User key={user.username} user={user} edit={()=>setEditing([user,true])} refresh={refresh} />)}
        </Wrapper>
    </Container>
    )
}
