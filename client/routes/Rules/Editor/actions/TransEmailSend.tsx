import { Grid, SimpleGrid, TextInput, Textarea } from '@mantine/core'
import { IconAt, IconTextCaption, IconUser, IconWorld } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'
import SecurePasswordInput from '../../../../components/SecurePasswordInput'
import Concealer from '../../../../components/Concealer'
import usePassword from '../../../../hooks/usePassword'

export default function TransEmailSend( { form, path, templateProps, config, configured }: actionProps ) {
  const { visible, options, secure, unlock } = usePassword(form, `${path}.password`);
  return (
  <>
    <Concealer label={configured?`Config (${configured})`:"Config"} open >
    <Grid>
      <Grid.Col span={9}>
        <TextInput
          label="Host"
          leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
          placeholder="smtp-mail.domain.com"
          withAsterisk={!config}
          {...templateProps(form, `${path}.host`)}
        />
      </Grid.Col>
      <Grid.Col span={3}>
        <TextInput
          label="Port"
          leftSection={<>:</>}
          placeholder="25"
          {...templateProps(form, `${path}.port`)}
        />
      </Grid.Col>
    </Grid>
    
    <SimpleGrid mt="sm" cols={{ base: 1, sm: 2 }} >
        <TextInput withAsterisk={!config}
          label="Username"
          placeholder="username"
          leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
          {...templateProps(form, `${path}.username`)}
        />
        <SecurePasswordInput withAsterisk={!config}
          label="Password" 
          placeholder="password"
          visible={visible}
          secure={secure}
          unlock={unlock}
          rightSectionX={options.buttons}
          {...templateProps(form, `${path}.password`, options)}
        />
    </SimpleGrid>
    
    </Concealer>
    <TextInput mt="xs"
        label="To" withAsterisk={!config}
        description="Comma separated list or an array of recipients email addresses that will appear on the To: field."
        placeholder="smith@domain.com"
        leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.to`)}
    />
    <TextInput mt="xs"
        label="From"
        description="The email address of the sender."
        placeholder="jane@domain.com"
        leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.from`)}
    />
    <TextInput mt="xs"
        label="Subject" withAsterisk={!config}
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
  </>
  )
}