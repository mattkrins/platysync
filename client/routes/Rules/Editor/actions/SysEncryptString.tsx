import { NumberInput, PasswordInput, TextInput } from '@mantine/core'
import { IconBraces, IconKey, IconLock, IconPencil } from '@tabler/icons-react'
import { actionOptions } from '../../../../modules/actions'

export default function SysEncryptString( { form, path, templateProps }: actionOptions ) {
  return (
  <>
    <TextInput
        label="Secret" withAsterisk
        description="String to be encrypted."
        placeholder="My very important secret"
        leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.secret`)}
    />
    <PasswordInput
        label="Encryption Key" withAsterisk mt="xs"
        description={<>String to encrypt the secret with. <b>Warning: this is stored in clear text</b></>}
        placeholder="password"
        leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        rightSectionWidth={"calc(var(--psi-icon-size) * 4)"}
        {...templateProps(form, `${path}.password`)}
    />
    <NumberInput mt="xs"
        label="Encryption Strength"
        description={<>How many <a href="https://en.wikipedia.org/wiki/PBKDF2" target="_blank" >C</a> iterations to use. Direct trade-off between speed and stength of security. </>}
        placeholder="1000"
        leftSection={<IconLock size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        min={100}
        {...form.getInputProps(`${path}.strength`)}
    />
    <TextInput
        label="Template Key" withAsterisk mt="xs"
        description="Encrypted string will be stored in this template key."
        placeholder="encrypted"
        leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.key`)}
    />
  </>
  )
}
