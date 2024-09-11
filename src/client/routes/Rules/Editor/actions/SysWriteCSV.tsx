import { Switch, TextInput, Textarea } from '@mantine/core'
import { IconCsv, IconFilePencil } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function SysWriteCSV( { form, path, templateProps, config }: actionProps ) {
  return (
  <>
    <TextInput
        label="Target CSV File" withAsterisk={!config}
        description="Path of file to write iterative results to."
        placeholder="D:/{{group}}/results.csv"
        leftSection={<IconCsv size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
    <Switch label="Filter Errors" description="Entries containing an error will not be written."
    mt="xs" {...form.getInputProps(`${path}.filter_errors`, { type: 'checkbox' })} color='red'
    />
    <Switch label="Filter Warnings" description="Entries containing a warning will not be written."
    mt="xs" {...form.getInputProps(`${path}.filter_warnings`, { type: 'checkbox' })} color='orange'
    />
  </>
  )
}
