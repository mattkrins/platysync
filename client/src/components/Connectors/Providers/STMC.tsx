import { TextInput, NumberInput, SimpleGrid, PasswordInput, ActionIcon } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconTag, IconSchool, IconClock, IconUser, IconKey, IconEdit, IconNetwork } from '@tabler/icons-react';
import Concealer from '../../Common/Concealer';
import SelectConnector from '../../Common/SelectConnector';

export default function PROXY( { form, editing }: { form: UseFormReturnType<Record<string, unknown>>, editing: Connector|undefined  } ) {
    //const list = Object.values(connectors);
    //const entries = list.filter(({ id }: {id: string})=>(id==="proxy")).map(({ name }: {name: string})=>({ value: name, label: name }));
    const unlock = () => form.setFieldValue('password', '');
    return (<>
    <TextInput
        label="Connector Name"
        leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        placeholder="School Name"
        withAsterisk {...form.getInputProps('name')}
    />
    <SimpleGrid mt="md" cols={{ base: 1, sm: 2 }} >
        <TextInput
            label="Username"
            placeholder="ST01235"
            withAsterisk
            leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            {...form.getInputProps('username')}
        />
        {(typeof form.values.password) === 'string' || !editing  ?<PasswordInput
            label="Password"
            placeholder="password"
            withAsterisk
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            {...form.getInputProps('password')}
        />:<PasswordInput
            label="Password"
            readOnly={true}
            placeholder="Password"
            value="**************"
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            rightSection={
                <ActionIcon variant="subtle"><IconEdit onClick={()=>unlock()} size={16} style={{ display: 'block', opacity: 0.5 }} /></ActionIcon>
            }
        />}
    </SimpleGrid>
    <TextInput
        label="School Identification Number"
        leftSection={<IconSchool size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        placeholder="1234"
        withAsterisk {...form.getInputProps('school')}
        mt="md"
    />
    <Concealer>
        <NumberInput
            label="Caching Policy"
            description="Minutes until downloaded cache is purged."
            leftSection={<IconClock size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="1440 (1 day)"
            {...form.getInputProps('cache')}
            mt="md"
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
        <SelectConnector
        label="eduHUB Connector"
        description="Matches eduHUB usernames to eduSTAR usernames."
        placeholder="ST_8827.csv"
        clearable
        {...form.getInputProps('eduhub')}
        filter={data=>data.filter(c=>c.id==="csv")}
        leftSection={<IconNetwork size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        mt="md"
        />
    </Concealer>
    </>);
}