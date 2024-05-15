import { TextInput, SimpleGrid, PasswordInput, ActionIcon, SegmentedControl, Input } from '@mantine/core'
import { UseFormReturnType } from '@mantine/form'
import { IconTag, IconWorld, IconUser, IconKey, IconEdit, IconNetwork } from '@tabler/icons-react'
import Concealer from '../../Common/Concealer';
import SelectConnector from '../../Common/SelectConnector';

export default function EMAIL( { form, editing }: { form: UseFormReturnType<Record<string, unknown>>, editing: boolean  } ) {
    const unlock = () => form.setFieldValue('password', '');
    return (<>
        <TextInput
            label="Connector Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="Proxy Name"
            withAsterisk {...form.getInputProps('name')}
        />
        <Input.Wrapper mt="xs" withAsterisk
        label="Transport"
        >
        <SegmentedControl fullWidth 
        {...form.getInputProps('type')}
        defaultValue="smtp"
        data={[
        { label: 'SMTP', value: 'smtp' },
        ]} />
        </Input.Wrapper>
        <TextInput
            label="Host"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="smtp-mail.domain.com"
            withAsterisk {...form.getInputProps('host')}
            mt="xs"
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
        <Concealer>
            <TextInput mt="xs"
                label="Port"
                leftSection={<>:</>}
                placeholder="25"
                {...form.getInputProps('port')}
            />
            <SelectConnector
            label="Proxy Connector"
            placeholder="Corporate Proxy Server"
            clearable
            {...form.getInputProps('proxy')}
            filter={data=>data.filter(c=>c.id==="proxy")}
            leftSection={<IconNetwork size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            mt="md"
            />
        </Concealer>
    </>)
}
