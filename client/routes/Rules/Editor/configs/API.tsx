import { Input, SegmentedControl, TextInput } from '@mantine/core'
import { IconWorld } from '@tabler/icons-react'
import { actionConfigProps } from '../../../../modules/actions'
import SecurePasswordInput from '../../../../components/SecurePasswordInput';

export default function API({ form, configProps }: actionConfigProps) {
  return (
  <>
        <TextInput
            label="Base API endpoint URL" mt="md"
            description="Prepended to all API target URLs."
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="https://service.com/api/v1"
            withAsterisk
            {...configProps('endpoint')}
        />
        <Input.Wrapper mt="xs" mb="xs" withAsterisk label="Authentication" >
        <SegmentedControl fullWidth 
        {...configProps('auth')}
        defaultValue="none"
        data={[
            { label: 'None', value: 'none' },
            { label: 'Basic', value: 'basic' },
            { label: 'Bearer Token', value: 'bearer' },
        ]} />
        </Input.Wrapper>
        {form.values.auth!=="none"&&
        <SecurePasswordInput withAsterisk mb="xs"
        label="Password"
        placeholder={form.values.auth==="basic"?"username:password":"secret"}
        secure={!!form.values.password&&typeof form.values.password !== 'string'}
        unlock={()=>form.setFieldValue("password", "")}
        {...configProps('password', false, true, "**************")}
        />} 
        <TextInput
            label="Append Query"
            description="Appended to all API target URLs (added to query string)."
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="access_token=secret"
            {...configProps('append')}
        />
  </>
  )
}