import { NumberInput, Switch, TextInput } from '@mantine/core'
import { IconBraces, IconClock, IconTerminal } from '@tabler/icons-react'
import { operationProps } from '../operations';
import ExtTextInput from '../../../../../components/ExtTextInput';

export default function SysRunCommand( { props, rule, blueprint }: operationProps ) {
  const detached = props(`detached`, { type: 'checkbox' }).checked||false;
  return (
  <>
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.command}
        label="Command"
        description="Arbitrary system command. Result of execution will be placed in {{stdout}} template."
        leftSection={<IconTerminal size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="/bin/echo {{username}}"
        {...props("command")}
    />
    <NumberInput mt="xs" withAsterisk={!blueprint?.timeout}
        label="Timeout"
        description="Action will fail after this many milliseconds."
        placeholder="5000"
        leftSection={<IconClock size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        min={10}
        {...props("timeout")}
    />
    <Switch label="Run Detached"
    description="Process will spawn detached from PlatySync and rule will not wait for execution to finish."
    mt="xs" {...props("detached", { type: 'checkbox' })}
    />
    <Switch label="Kill After Timeout"
    description="Attempt to forcefully kill the process if timeout is reached."
    mt="xs" {...props("kill", { type: 'checkbox' })}
    />
    {!detached&&<TextInput
        label="Template Key" mt="xs"
        description="stdout will be stored in this template key."
        leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="stdout"
        {...props("key")}
    />}
  </>
  )
}
