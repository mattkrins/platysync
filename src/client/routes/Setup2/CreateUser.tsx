import { TextInput, PasswordInput, Button, Container, Paper, Title, Text, Alert } from "@mantine/core";
import { useForm, isNotEmpty } from "@mantine/form";
import classes from './Setup.module.css';
import useAPI from "../../hooks/useAPI";
import { useLocation } from "wouter";
import { onKeyUp } from "../../modules/common";
import PasswordStrength from "../../components/PasswordStrength";
import { IconUser, IconKey, IconAlertCircle } from "@tabler/icons-react";
import { useDispatch } from "../../hooks/redux";
import { login } from "../../providers/appSlice";

export default function CreateUser() {
    const [_, setLocation] = useLocation();
    const dispatch = useDispatch();
    const form = useForm({
        initialValues: { username: '', password: '', confirm: '' },
        validate: {
            username: isNotEmpty('Username can not be empty.'),
            password: isNotEmpty('Password can not be empty.'),
        },
    });

    const { post, loading, error } = useAPI<Session>( {
        url: "/auth/setup", form,
        then: session => {
            dispatch(login(session));
            setLocation('/setup/2');
        },
    } );

    const submit = () => post();
    
    return (
    <Container size={400} my={20}>
        <Title ta="center" className={classes.title}>Let&apos;s Begin!</Title>
        <Text size="sm" ta="center">Step 1 of 2</Text>
        <Text c="dimmed" size="sm" ta="center">Create the initial administrative user</Text>
        <Paper className={classes.box} withBorder shadow="md" p="lg" mt="xs" radius="md">
            <TextInput leftSection={<IconUser size={16} />} {...form.getInputProps('username')} onKeyUp={onKeyUp(submit)} label="Username" placeholder="administrator" required classNames={{ input: classes.input }} />
            <PasswordStrength form={form} formKey="password" placeholder="admin password" required classNames={{ input: classes.input }} mt="xs" />
            <PasswordInput leftSection={<IconKey size={16} />} {...form.getInputProps('confirm')} onKeyUp={onKeyUp(submit)} label="Confirm Password" placeholder="admin password" required mt="xs" classNames={{ input: classes.input }} />
            {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
            <Button loading={loading } onClick={submit} fullWidth mt="md">Create User</Button>
        </Paper>
    </Container>
    );
}