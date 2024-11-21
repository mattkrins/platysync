import { Switch } from '@mantine/core'
import { IconCsv } from '@tabler/icons-react'
import ExtTextInput from '../../../../../components/ExtTextInput'
import { operationProps } from '../operations'

export default function SysWriteCSV( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.target}
        label="Target CSV File"
        description="Path of file to write iterative results to."
        placeholder="D:/{{group}}/results.csv"
        leftSection={<IconCsv size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...props("target")}
    />
    <Switch label="Filter Errors" description="Entries containing an error will not be written."
    mt="xs" {...props("filter_errors", { type: 'checkbox' })} color='red'
    />
    <Switch label="Filter Warnings" description="Entries containing a warning will not be written."
    mt="xs" {...props("filter_warnings", { type: 'checkbox' })} color='orange'
    />
  </>
  )
}
