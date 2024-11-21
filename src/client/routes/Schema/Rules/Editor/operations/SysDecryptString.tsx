import { NumberInput } from '@mantine/core'
import { IconBraces, IconKey, IconLock, IconPencil } from '@tabler/icons-react'
import { operationProps } from '../operations';
import SecurePasswordInput from '../../../../../components/SecurePasswordInput';
import ExtTextInput from '../../../../../components/ExtTextInput';

export default function SysDecryptString( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule}
        label="Secret" withAsterisk={!blueprint?.secret}
        description="String (JSON) to be decrypted."
        leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="{ hex, iv, it }"
        {...props("secret")}
    />
    <SecurePasswordInput
        label="Encryption Key" withAsterisk={!blueprint?.password} mt="xs"
        description={<>String to decrypt the secret with. <b>Warning: this is stored in clear text</b></>}
        placeholder="password"
        leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...props("password", { type: "password" })}
    />
    <NumberInput mt="xs"
        label="Encryption Strength"
        description={<>How many <a href="https://en.wikipedia.org/wiki/PBKDF2" target="_blank" >C</a> iterations were used to encrypt the string.</>}
        placeholder="1000"
        leftSection={<IconLock size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        min={100}
        {...props("strength")}
    />
    <ExtTextInput rule={rule}
        label="Template Key" withAsterisk={!blueprint?.key} mt="xs"
        description="Decrypted string will be stored in this template key as plain text."
        placeholder="decrypted"
        leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...props("key")}
    />
  </>
  )
}
