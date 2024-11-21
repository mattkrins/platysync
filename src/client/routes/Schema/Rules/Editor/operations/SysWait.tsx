import { Switch } from '@mantine/core'
import { IconClock } from '@tabler/icons-react'
import ExtTextInput from '../../../../../components/ExtTextInput'
import { operationProps } from '../operations'

export default function SysWait( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.time}
        label="Wait For"
        description="Time to wait / delay the next action for in milliseconds."
        placeholder="1000"
        leftSection={<IconClock size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...props("time")}
    />
    <Switch label="Also wait during evaluation"
    mt="xs" {...props("evaluation", { type: 'checkbox' })}
    />
  </>
  )
}
