import { Alert, Box, Button, Group, PasswordInput, Select, Switch, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconUser, IconKey, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import useAPI from "../../hooks/useAPI";
import { useContext } from "react";
import AppContext from "../../providers/AppContext";

export default function Editor( { editing, adding, close, refresh, admins }: { editing: user, close(): void, adding?: boolean, refresh(): void, admins: number } ) {
    const form = useForm<user>({ initialValues: editing });
    const { username } = useContext(AppContext);

    const { data: success, post, put, loading, error } = useAPI({
        url: '/user',
        data: { form: form.values, editing }, 
        form,
        noError: true,
        then: () => { refresh(); if (adding) close(); }
    });

    const inValid = !form.values.username||!form.values.group||(adding&&!form.values.password);
    const admin = (form.values.group||"") == "admin";
    const self = username === editing.username;

    return (
    <Box>
        <TextInput
        label="Username"
        placeholder="john.smith" required
        {...form.getInputProps('username')}
        leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        />
        <PasswordInput mt="xs"
        label="Password"
        placeholder="password" required={adding}
        leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        {...form.getInputProps('password')}
        />
        <Select mt="xs"
        label="Group" required
        placeholder="Pick group"
        description="Only admins have access to the user manager."
        data={['admin', 'user']}
        {...form.getInputProps('group')}
        disabled={!adding&&admins<=1&&admin}
        />
        <Switch mt="xs" {...form.getInputProps('stats', { type: 'checkbox' })} disabled={adding||!self} label="Allow collection of anonymous statistics"/>
        <Switch mt="xs" {...form.getInputProps('enabled', { type: 'checkbox' })} disabled={!adding&&admins<=1&&admin} label="User Enabled"/>
        {!!success&&<Alert mt="xs" icon={<IconCheck size={32} />} color="lime">Changes saved.</Alert>}
        {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
        <Group justify="right" mt="md"><Button loading={loading} disabled={inValid} onClick={()=>adding?post():put()} variant="light" type="submit" >{adding?'Add':'Save'}</Button></Group>
    </Box>)
}
