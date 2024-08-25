import { NumberInput, Switch, TextInput } from '@mantine/core'
import { IconBraces, IconClock, IconTerminal } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function SysRunCommand( { form, path, templateProps, config }: actionProps ) {
  const detached = form.getInputProps(`${path}.detached`, { type: 'checkbox' }).checked||false;
  return (
  <>
    <TextInput
        label="Command" withAsterisk={!config}
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
        min={10}
        {...form.getInputProps(`${path}.timeout`)}
    />
    <Switch label="Run Detached"
    description="Process will spawn detached from PlatySync and rule will not wait for execution to finish."
    mt="xs" {...form.getInputProps(`${path}.detached`, { type: 'checkbox' })}
    />
    <Switch label="Kill After Timeout"
    description="Attempt to forcefully kill the process if timeout is reached."
    mt="xs" {...form.getInputProps(`${path}.kill`, { type: 'checkbox' })}
    />
    {!detached&&<TextInput
        label="Template Key" mt="xs"
        description="stdout will be stored in this template key."
        placeholder="stdout"
        leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.key`)}
    />}
  </>
  )
}
