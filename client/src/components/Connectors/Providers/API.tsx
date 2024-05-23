import { ActionIcon, PasswordInput, TextInput } from "@mantine/core";
import { IconTag, IconWorld, IconKey, IconEdit } from "@tabler/icons-react";
import { UseFormReturnType } from '@mantine/form';
import Concealer from "../../Common/Concealer";

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
            label="API endpoint URL" mt="md"
            description="Prepended to all API target URLs."
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="https://service.com/api/v1"
            withAsterisk
            {...form.getInputProps('endpoint')}
        />
        <Concealer label="Authentication" open >
            {(typeof form.values.bearer) === 'string' || !editing  ?<PasswordInput
                label="Bearer Token"
                description="OAuth 2.0 bearer token."
                placeholder="secret"
                leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                {...form.getInputProps('bearer')}
            />:<PasswordInput
                label="Bearer Token"
                description="OAuth 2.0 bearer token."
                readOnly={true}
                value="**************"
                leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                rightSection={ <ActionIcon variant="subtle"><IconEdit onClick={()=>form.setFieldValue('bearer', '')} size={16} style={{ display: 'block', opacity: 0.5 }} /></ActionIcon> }
            />}
            {(typeof form.values.basic) === 'string' || !editing  ?<PasswordInput
                label="Basic"
                description="Credentials to be Base64 encoded."
                placeholder="username:password"
                leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                {...form.getInputProps('basic')}
            />:<PasswordInput
                label="Basic"
                description="Credentials to be Base64 encoded."
                readOnly={true}
                value="**************"
                leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                rightSection={ <ActionIcon variant="subtle"><IconEdit onClick={()=>form.setFieldValue('basic', '')} size={16} style={{ display: 'block', opacity: 0.5 }} /></ActionIcon> }
            />}
        </Concealer>
        <Concealer>
            <TextInput
                label="Append Query" mt="md"
                description="Appended to all API target URLs (added to query string)."
                leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="access_token=secret"
                {...form.getInputProps('append')}
            />
        </Concealer>
    </>);
}