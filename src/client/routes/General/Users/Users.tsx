import { useState } from "react";
import { Container, Group, Title, Button, Paper, Grid, Text } from "@mantine/core";
import Editor from "./Editor";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import useAPI from "../../../hooks/useAPI";
import Wrapper from "../../../components/Wrapper";
import MenuTip from "../../../components/MenuTip";
import { modals } from "@mantine/modals";
import { useSelector } from "../../../hooks/redux";

function User({ user: { username }, edit, refresh }: { user: User, edit(): void, refresh(): void }) {
    const { auth: { username: self } } = useSelector(state => state.app);
    const { del, loading: deleting, error: dError, reset: dReset } = useAPI<User[]>({
        url: "/user", data: { username },
        then: () => refresh()
    });

    const clickDel = () =>
    modals.openConfirmModal({
        title: 'Delete User',
        children: <Text size="sm">Are you sure you want to delete <b>{username}</b>?</Text>,
        labels: { confirm: 'Delete user', cancel: "Cancel" },
        confirmProps: { color: 'red' },
        onConfirm: async () => await del(),
    });
    
    return (
    <Paper mb="xs" p="xs" withBorder >
        <Grid justify="space-between"  align="center" >
            <Grid.Col span={10}>{username}</Grid.Col>
            <Grid.Col span={2}>
                    <Group gap="xs" justify="flex-end">
                        <MenuTip label="Edit" Icon={IconPencil} onClick={edit} color="orange" variant="subtle" />
                        <MenuTip label="Delete" disabled={self===username} Icon={IconTrash} error={dError} reset={dReset} onClick={clickDel} loading={deleting} color="red" variant="subtle" />
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
