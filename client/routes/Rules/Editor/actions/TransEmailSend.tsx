import { Grid, SimpleGrid, TextInput, Textarea } from '@mantine/core'
import { IconAt, IconTextCaption, IconUser, IconWorld } from '@tabler/icons-react'
import { actionConfigProps, actionProps } from '../../../../modules/actions'
import SecurePasswordInput from '../../../../components/SecurePasswordInput'

export default function TransEmailSend( { form, path, templateProps }: actionProps ) {
  return (
  <>
    <TextInput mt="xs"
        label="To" withAsterisk
        description="Comma separated list or an array of recipients email addresses that will appear on the To: field."
        placeholder="smith@domain.com"
        leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.to`)}
    />
    <TextInput mt="xs"
        label="Subject" withAsterisk
        description="The subject of the email."
        placeholder="RE: Subject"
        leftSection={<IconTextCaption size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.subject`)}
    />
    <Textarea mt="xs"
        label="Message / Body"
        description="Plaintext version of the message to send."
        placeholder="Plaintext body."
        {...templateProps(form, `${path}.text`)}
    />
    <Textarea mt="xs"
        label="Message / Body (HTML)"
        description="HTML version of the message to send."
        placeholder="<p>HTML body.</p>"
        {...templateProps(form, `${path}.html`)}
    />
    <TextInput mt="xs"
        label="From"
        description="The email address of the sender."
        placeholder="jane@domain.com"
        leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.from`)}
    />
  </>
  )
}

export function TransEmailSendConfig({ form }: actionConfigProps) {
  return (
  <>
    <Grid>
      <Grid.Col span={9}>
        <TextInput
            label="Host"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="smtp-mail.domain.com"
            withAsterisk {...form.getInputProps('host')}
        />
      </Grid.Col>
      <Grid.Col span={3}>
        <TextInput
            label="Port"
            leftSection={<>:</>}
            placeholder="25"
            {...form.getInputProps('port')}
        />
      </Grid.Col>
    </Grid>
    <SimpleGrid mt="sm" cols={{ base: 1, sm: 2 }} >
        <TextInput withAsterisk
            label="Username"
            placeholder="username"
            leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            {...form.getInputProps('username')}
        />
        <SecurePasswordInput withAsterisk
        label="Password"
        placeholder="password"
        secure={!!form.values.password&&typeof form.values.password !== 'string'}
        unlock={()=>form.setFieldValue("password", "")}
        {...form.getInputProps('password')}
        />
    </SimpleGrid>
    <TextInput mt="xs"
        label="From"
        description="The email address of the sender."
        placeholder="jane@domain.com"
        leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...form.getInputProps('from')}
    />
  </>
  )
}