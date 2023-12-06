import { TextInput, PasswordInput, Text, Paper, Title, Container, Button, Checkbox, Group } from '@mantine/core';
import useFetch from '../../hooks/useFetch';
import { FormErrors, hasLength, isNotEmpty, useForm } from '@mantine/form';
import { useContext } from 'react';
import AuthContext from '../../providers/AuthContext';
import classes from './Login.module.css';

export function Setup({ completeSetup }:{ completeSetup(): void }) {
    const { login } = useContext(AuthContext);
    const form = useForm({
        initialValues: {
            username: '',
            password: '',
            collection: false,
        },
        validate: {
            username: isNotEmpty('Username can not be empty.'),
            password: hasLength({ min: 5 }, 'Password must be at least 5 characters long.')
        },
    });
    const { post, loading } = useFetch({
        url: `/setup`,
        data: form.values,
        then: (user) => { completeSetup(); login(JSON.stringify(user)); },
        catch: ({validation}:{validation: FormErrors}) => form.setErrors(validation),
    });
    const validate = () => {
        form.validate();
        if (form.isValid()) post();
    }
    const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && validate();
    return (
        <Container size={420} my={40}>
            <Title ta="center" >New Installation</Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>Please create the initial administrative user.</Text>
            <Paper className={classes.box} withBorder shadow="md" p={30} mt={30} radius="md">
                <TextInput classNames={{ input: classes.input }} onKeyUp={onKeyUp} {...form.getInputProps('username')} label="Username" placeholder="Your Username" required />
                <PasswordInput classNames={{ input: classes.input }} onKeyUp={onKeyUp} {...form.getInputProps('password')} label="Password" placeholder="Your password" required mt="md" />
                <Group justify="space-between" mt="lg">
                    <Checkbox {...form.getInputProps('collection', { type: 'checkbox' })} label="Allow collection of anonymous statistics" />
                </Group>
                <Button onClick={()=>validate()} loading={loading} fullWidth mt="xl">Create User</Button>
            </Paper>
        </Container>
    );
}