import { Grid, SimpleGrid, Textarea, TextareaProps } from '@mantine/core'
import { IconAt, IconKey, IconTextCaption, IconUser, IconWorld } from '@tabler/icons-react'
import { operationProps } from '../operations'
import Concealer from '../../../../../components/Concealer'
import SecurePasswordInput from '../../../../../components/SecurePasswordInput'
import ExtTextInput from '../../../../../components/ExtTextInput'

function SMTPSettings( { props, rule, blueprint }: operationProps ) {
  return (
    <Concealer label="SMTP Settings" open={!blueprint?.host||!blueprint?.username} >
      <Grid>
        <Grid.Col span={9}>
          <ExtTextInput rule={rule} withAsterisk={!blueprint?.host}
            label="Host"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="smtp-mail.domain.com"
            {...props("host")}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <ExtTextInput rule={rule}
            label="Port"
            leftSection={<>:</>}
            placeholder="25"
            {...props("port")}
          />
        </Grid.Col>
      </Grid>
      <SimpleGrid mt="sm" cols={{ base: 1, sm: 2 }} >
          <ExtTextInput rule={rule} withAsterisk={!blueprint?.username}
            label="Username"
            placeholder="username"
            leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            {...props("username")}
          />
          <SecurePasswordInput
              label="Password" withAsterisk={!blueprint?.password}
              placeholder="password"
              leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
              {...props("password", { type: "password" })}
          />
      </SimpleGrid>
    </Concealer>
  )
}

function EnvelopeSettings( { props, rule, blueprint }: operationProps ) {
  return (
    <Concealer label="Envelope Settings" open={!blueprint?.to||!blueprint?.from} >
      <ExtTextInput rule={rule} withAsterisk={!blueprint?.to}
          label="To"
          description="Comma separated list or an array of recipients email addresses that will appear on the To: field."
          placeholder="smith@domain.com"
          leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
          {...props("to")}
      />
      <ExtTextInput rule={rule} withAsterisk={!blueprint?.from}
          label="From"
          description="The email address of the sender."
          placeholder="jane@domain.com"
          leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
          {...props("from")}
      />
      <ExtTextInput rule={rule} withAsterisk={!blueprint?.subject}
          label="Subject"
          description="The subject of the email."
          placeholder="RE: Subject"
          leftSection={<IconTextCaption size={16} style={{ display: 'block', opacity: 0.8 }}/>}
          {...props("subject")}
      />
    </Concealer>
  )
}

export default function TransEmailSend( { props, rule, blueprint, ...rest }: operationProps ) {
  return (
  <>
    <SMTPSettings props={props} rule={rule} blueprint={blueprint} {...rest} />
    <EnvelopeSettings props={props} rule={rule} blueprint={blueprint} {...rest} />
    <ExtTextInput<TextareaProps> Component={Textarea} rule={rule} withAsterisk={!blueprint?.data}
        label="Message / Body" mt="xs"
        description="Plaintext version of the message to send."
        placeholder="Plaintext body."
        {...props("text")}
    />
    <ExtTextInput<TextareaProps> Component={Textarea} rule={rule} withAsterisk={!blueprint?.data}
        label="Message / Body (HTML)"
        description="HTML version of the message to send."
        placeholder="<p>HTML body.</p>"
        {...props("html")}
    />
  </>
  )
}