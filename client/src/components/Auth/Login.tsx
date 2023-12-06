import { useContext, useEffect } from 'react';
import { TextInput, PasswordInput, Checkbox, Anchor, Paper, Title, Container, Group, Button, ActionIcon } from '@mantine/core';
import AuthContext from '../../providers/AuthContext';
import { useLocalStorage } from '@mantine/hooks';
import { Setup } from './Setup';
import { FormErrors, isNotEmpty, useForm } from '@mantine/form';
import useFetch from '../../hooks/useFetch';
import { IconX } from '@tabler/icons-react';
import classes from './Login.module.css';

export function Login() {
    const [setupComplete, _setup, reset] = useLocalStorage({ key: 'setup', defaultValue: 'false' });
    const [memorised, remember, forget] = useLocalStorage({ key: 'lastLogin', defaultValue: '' });
    const completeSetup = () => _setup('true');
    const { login } = useContext(AuthContext);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[ memorised ])

    const { post, loading } = useFetch({
        url: `/auth`,
        data: form.values,
        then: (user) => {
            if (form.values.checked){ remember(user.username); }else{ forget(); }
            login(JSON.stringify(user));
        },
        catch: ({validation}:{validation: FormErrors}) => form.setErrors(validation),
    });
    useFetch({
        url: `/setup`,
        fetch: true,
        then: ({status}) => status ? completeSetup() : reset(),
    });

    const validate = () => {
        form.validate();
        if (form.isValid()) post();
    }
    const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && validate();
    return (
        (!setupComplete||setupComplete=="false") ? <Setup completeSetup={completeSetup} /> :
        <Container size={420} my={40}>
            <Title ta="center" >CDAPP Login</Title>
            <Paper className={classes.box} withBorder shadow="md" p={30} mt={30} radius="md">
                <TextInput
                classNames={{ input: classes.input }}
                onKeyUp={onKeyUp} {...form.getInputProps('username')} label="Username" placeholder="Your Username" required
                rightSection={memorised&&<ActionIcon variant="subtle" size="sm" onClick={()=>forget()}
                ><IconX size={16} style={{ display: 'block', opacity: 0.5 }} /></ActionIcon>}
                />
                <PasswordInput classNames={{ input: classes.input }} onKeyUp={onKeyUp} {...form.getInputProps('password')} label="Password" placeholder="Your password" required mt="md" />
                <Group justify="space-between" mt="lg">
                    <Checkbox label="Remember me" {...form.getInputProps('checked', { type: 'checkbox' })} />
                    <Anchor component="button" size="sm">Forgot password?</Anchor>
                </Group>
                <Button onClick={()=>validate()} loading={loading} fullWidth mt="xl">Sign in</Button>
            </Paper>
        </Container>
    );
}