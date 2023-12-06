import { useForm, isNotEmpty, hasLength } from '@mantine/form';
import { TextInput, Box, PasswordInput, Select } from '@mantine/core';
import { IconTag, IconBriefcase, IconUser, IconKey, IconWorldUpload } from '@tabler/icons-react';

export default function Azure() {
    const form = useForm({
        initialValues: {
            name: '',
            path: '',
            id: '',
            username: '',
            password: ''
        },
        validate: {
            path: hasLength({ min: 3 }, 'Path must be at least 3 characters long.'),
            name: isNotEmpty('Name can not be empty.'),
            id: isNotEmpty('Tenant ID can not be empty.'),
            username: isNotEmpty('Username can not be empty.'),
            password: isNotEmpty('Password can not be empty.')
        },
    });
    return (
        <Box component="form" mx="auto" onSubmit={form.onSubmit(() => {})}>
            <TextInput
                label="Tenant Name"
                leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="File Name"
                withAsterisk {...form.getInputProps('name')}
            />
            <TextInput
                label="Tenant ID"
                leftSection={<IconBriefcase size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="abcdefgh-1234-5678-abcd-1234567890ef"
                withAsterisk {...form.getInputProps('id')}
                mt="md"
            />
            <TextInput
                label="Client ID"
                leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="12345678-abcd-1234-efgh-1234567890ab"
                withAsterisk {...form.getInputProps('username')}
                mt="md"
            />
            <PasswordInput
                label="Client Secret"
                placeholder="Secret Key"
                withAsterisk
                leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                {...form.getInputProps('password')}
                mt="md"
            />
            <Select
                label="Proxy Connection"
                placeholder="Corporate Proxy Server"
                clearable
                leftSection={<IconWorldUpload size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                data={[
                    { value: 'eduProxy', label: 'eduProxy' },
                ]}
                mt="md"
            />
        </Box>
    );
}