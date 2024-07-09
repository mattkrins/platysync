import { NumberInput, TextInput } from '@mantine/core'
import { IconClock, IconFileMinus, IconTerminal } from '@tabler/icons-react'
import { actionOptions } from '../../../../modules/actions'

export default function SysRunCommand( { form, path, templateProps }: actionOptions ) {
  return (
  <>
    <TextInput
        label="Command" withAsterisk
        description="Arbitrary system command. Result of execution will be placed in {{stdout}} template."
        placeholder="/bin/echo {{username}}"
        leftSection={<IconTerminal size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.command`)}
    />
    <NumberInput mt="xs"
        label="Timeout"
        description="Action will fail after this many milliseconds."
        placeholder="5000"
        leftSection={<IconClock size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        min={100}
        {...form.getInputProps(`${path}.timeout`)}
    />
  </>
  )
}
