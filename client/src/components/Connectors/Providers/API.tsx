import { ActionIcon, Input, PasswordInput, SegmentedControl, TextInput } from "@mantine/core";
import { IconTag, IconWorld, IconKey, IconEdit, IconNetwork, IconTestPipe } from "@tabler/icons-react";
import { UseFormReturnType } from '@mantine/form';
import Concealer from "../../Common/Concealer";
import SelectConnector from "../../Common/SelectConnector";

export default function API( { form, editing }: { form: UseFormReturnType<Record<string, unknown>>, editing: boolean  } ) {
    return (
    <>
        <TextInput
            label="Connector Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="File Name"
            withAsterisk {...form.getInputProps('name')}
        />
        <TextInput
            label="Base API endpoint URL" mt="md"
            description="Prepended to all API target URLs."
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="https://service.com/api/v1"
            withAsterisk
            {...form.getInputProps('endpoint')}
        />
        <Input.Wrapper mt="xs" mb="xs" withAsterisk label="Authentication" >
        <SegmentedControl fullWidth 
        {...form.getInputProps('auth')}
        defaultValue="none"
        data={[
            //{ label: 'OAuth 2.0', value: 'oauth' },
            { label: 'None', value: 'none' },
            { label: 'Basic', value: 'basic' },
            { label: 'Bearer Token', value: 'bearer' },
        ]} />
        </Input.Wrapper>
        {form.values.auth!=="none"&&<>
        {(typeof form.values.password) === 'string' || !editing  ?<PasswordInput
            placeholder={form.values.auth==="basic"?"username:password":"secret"}
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            {...form.getInputProps('password')}
        />:<PasswordInput
            readOnly={true}
            value="**************"
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            rightSection={ <ActionIcon variant="subtle"><IconEdit onClick={()=>form.setFieldValue('password', '')} size={16} style={{ display: 'block', opacity: 0.5 }} /></ActionIcon> }
        />}
        </>}
        <Concealer>
            <TextInput
                label="Append Query"
                description="Appended to all API target URLs (added to query string)."
                leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="access_token=secret"
                {...form.getInputProps('append')}
            />
            <SelectConnector mt="xs"
                label="Proxy Connector"
                placeholder="Corporate Proxy Server"
                clearable
                {...form.getInputProps('proxy')}
                filter={data=>data.filter(c=>c.id==="proxy")}
                leftSection={<IconNetwork size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            />
            <TextInput mt="xs"
                label="Test Endpoint"
                description="Get request expecting response 200 to test authentication."
                leftSection={<IconTestPipe size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="/some/endpoint"
                {...form.getInputProps('test')}
            />
        </Concealer>
    </>);
}