import { TextInput, SimpleGrid, PasswordInput, ActionIcon } from '@mantine/core'
import { UseFormReturnType } from '@mantine/form'
import { IconTag, IconWorld, IconUser, IconKey, IconEdit } from '@tabler/icons-react'

export default function PROXY( { form, editing }: { form: UseFormReturnType<Record<string, unknown>>, editing: boolean  } ) {
    const unlock = () => form.setFieldValue('password', '');
    return (<>
        <TextInput
            label="Connector Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="Proxy Name"
            withAsterisk {...form.getInputProps('name')}
        />
        <TextInput
            label="Target URL"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="http://proxy.server:8080"
            withAsterisk {...form.getInputProps('url')}
            mt="md"
        />
        <SimpleGrid mt="md" cols={{ base: 1, sm: 2 }} >
        <TextInput
            label="Username"
            placeholder="username"
            {...form.getInputProps('username')}
            leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        />
        {(typeof form.values.password) === 'string' || !editing  ?<PasswordInput
            label="Password"
            placeholder="password"
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            {...form.getInputProps('password')}
        />:<PasswordInput
            label="Password"
            readOnly={true}
            placeholder="Password"
            value="**************"
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            rightSection={
                <ActionIcon variant="subtle" ><IconEdit onClick={()=>unlock()} size={16} style={{ display: 'block', opacity: 0.5 }} /></ActionIcon>
            }
        />}
        </SimpleGrid>
    </>)
}
