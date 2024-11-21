import { NumberInput } from '@mantine/core'
import { IconBraces, IconKey, IconLock, IconPencil } from '@tabler/icons-react'
import { operationProps } from '../operations';
import SecurePasswordInput from '../../../../../components/SecurePasswordInput';
import ExtTextInput from '../../../../../components/ExtTextInput';

export default function SysEncryptString( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule}
        label="Secret" withAsterisk={!blueprint?.secret}
        description="String to be encrypted."
        leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="My very important secret"
        {...props("secret")}
    />
    <SecurePasswordInput
        label="Encryption Key" withAsterisk={!blueprint?.password} mt="xs"
        description={<>String to encrypt the secret with. <b>Warning: this is stored in clear text</b></>}
        placeholder="password"
        leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...props("password", { type: "password" })}
    />
    <NumberInput mt="xs"
        label="Encryption Strength"
        description={<>How many <a href="https://en.wikipedia.org/wiki/PBKDF2" target="_blank" >C</a> iterations to use. Direct trade-off between speed and stength of security. </>}
        placeholder="1000"
        leftSection={<IconLock size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        min={100}
        {...props("strength")}
    />
    <ExtTextInput rule={rule}
        label="Template Key" withAsterisk={!blueprint?.key} mt="xs"
        description="Encrypted string (JSON) will be stored in this template key."
        placeholder="encrypted"
        leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...props("key")}
    />
  </>
  )
}
