import { useContext, useEffect } from 'react';
import { TextInput, PasswordInput, Checkbox, Anchor, Paper, Title, Container, Group, Button, ActionIcon, Avatar, Center, Alert } from '@mantine/core';
import AppContext, { session } from '../../providers/AppContext';
import { useLocalStorage } from '@mantine/hooks';
import { Setup } from './Setup';
import { isNotEmpty, useForm } from '@mantine/form';
import { IconAlertCircle, IconX } from '@tabler/icons-react';
import classes from './Login.module.css';
import useAPI from '../../hooks/useAPI';

export function Login() {
    const [setupComplete, _setup, reset] = useLocalStorage({ key: 'setup', defaultValue: 'false' });
    const [memorised, remember, forget] = useLocalStorage({ key: 'lastLogin', defaultValue: '' });
    const completeSetup = () => _setup('true');
    const { login } = useContext(AppContext);
    const form = useForm({
        initialValues: {
            username: '',
            password: '',
            checked: false,
        },
        validate: {
            username: isNotEmpty('Username can not be empty.'),
            password: isNotEmpty('Password can not be empty.'),
        },
    });
    useEffect(()=>{
        form.setFieldValue('username', memorised||'');
        form.setFieldValue('checked', memorised===''?false:true );
    },[ memorised ])
    const { post, loading, error } = useAPI({
        url: `/auth`,
        data: form.values,
        form,
        noAuth: true,
        noError: true,
        check: () => {form.validate(); return !form.isValid();},
        then: (session: session) => {
            if (!session.username) return;
            if (form.values.checked){ remember(session.username); }else{ forget(); }
            login(session);
        },
    });
    useAPI({
        url: `/auth/setup`,
        fetch: true,
        noAuth: true,
        noError: true,
        then: (status?: boolean) => status ? completeSetup() : reset(),
    });
    const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && post();
    return (
        (!setupComplete||setupComplete=="false") ? <Setup completeSetup={completeSetup} /> :
        <Container size={420} my={40}>
            <Center><Avatar src={'/logo192.png'} size="xl" /></Center>
            <Title ta="center" >PlatySync Login</Title>
            <Paper className={classes.box} withBorder shadow="md" p={30} mt={30} radius="md">
                <TextInput
                classNames={{ input: classes.input }}
                onKeyUp={onKeyUp} {...form.getInputProps('username')} label="Username" placeholder="Your Username" required
                rightSection={memorised&&<ActionIcon variant="subtle" size="sm" onClick={()=>forget()}
                ><IconX size={16} style={{ display: 'block', opacity: 0.5 }} /></ActionIcon>}
                />
                <PasswordInput classNames={{ input: classes.input }} onKeyUp={onKeyUp} {...form.getInputProps('password')} label="Password" placeholder="Your password" required mt="md" />
                {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
                <Group justify="space-between" mt="lg">
                    <Checkbox label="Remember me" {...form.getInputProps('checked', { type: 'checkbox' })} />
                    <Anchor href="https://github.com/mattkrins/platysync/wiki/Troubleshooting#forgot-password" target="_blank" size="sm">Forgot password?</Anchor>
                </Group>
                <Button onClick={()=>post()} loading={loading} fullWidth mt="xl">Sign in</Button>
            </Paper>
        </Container>
    );
}