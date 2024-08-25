import { Switch, TextInput } from '@mantine/core'
import { IconClock, IconFileMinus } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function SysWait( { form, path, templateProps, config }: actionProps ) {
  return (
  <>
    <TextInput
        label="Wait For" withAsterisk={!config}
        description="Time to wait / delay the next action for in milliseconds."
        placeholder="1000"
        leftSection={<IconClock size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.time`)}
    />
    <Switch label="Also wait during evaluation"
    mt="xs" {...form.getInputProps(`${path}.evaluation`, { type: 'checkbox' })}
    />
  </>
  )
}
