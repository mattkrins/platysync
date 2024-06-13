import { TextInput, PasswordInput, Button, Container, Paper, Title, Text, Avatar, Center, Anchor, Alert } from "@mantine/core";
import { useForm, isNotEmpty } from "@mantine/form";
import classes from './Login.module.css';
import useAPI from "../../hooks/useAPI";
import { useLocation } from "wouter";
import { onKeyUp } from "../../modules/common";
import { IconAlertCircle, IconKey, IconUser } from "@tabler/icons-react";

export default function Login() {
    const [_, setLocation] = useLocation();
    const form = useForm({
        initialValues: { username: '', password: '', confirm: '' },
        validate: {
            username: isNotEmpty('Username can not be empty.'),
            password: isNotEmpty('Password can not be empty.'),
        },
    });

    const { post, loading, error } = useAPI({
        url: "/api/v1/auth", form, noAuth: true,
        then: () => setLocation('/'),
    });

    const submit = () => post();
    
    return (
    <Container size={400} my={20}>
        <Center><Avatar src={'/logo.png'} size="xl" /></Center>
        <Title ta="center" className={classes.title}>PlatySync Login</Title>
        <Paper className={classes.box} withBorder shadow="md" p="lg" mt="xs" radius="md">
            <TextInput leftSection={<IconUser size={16} />} {...form.getInputProps('username')} onKeyUp={onKeyUp(submit)} label="Username" placeholder="Your username" required classNames={{ input: classes.input }} />
            <PasswordInput leftSection={<IconKey size={16} />} {...form.getInputProps('password')} onKeyUp={onKeyUp(submit)} label="Password" placeholder="Your password" required mt="xs" classNames={{ input: classes.input }} />
            <Text pt="xs"><Anchor href="https://github.com/mattkrins/platysync/wiki/Troubleshooting#forgot-password" target="_blank" size="xs">Forgot password?</Anchor></Text>
            {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
            <Button loading={loading } onClick={submit} fullWidth mt="md">Sign In</Button>
        </Paper>
    </Container>
    );
}