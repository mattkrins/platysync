import { Switch, TextInput, Textarea } from '@mantine/core'
import { IconFilePencil } from '@tabler/icons-react'
import { actionOptions } from '../../../../modules/actions'

export default function FileWriteTxt( { form, path, templateProps }: actionOptions ) {
  return (
  <>
    <TextInput
        label="Target File" withAsterisk
        description="Path of file to append text to."
        placeholder="D:/{{group}}/rows.csv"
        leftSection={<IconFilePencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
    <Textarea mt="xs"
        label="Data" withAsterisk
        description="Text to append to target file."
        placeholder="{{id}},false,0"
        {...templateProps(form, `${path}.data`)}
    />
    <Switch label="Append New Line"
    mt="xs" {...form.getInputProps(`${path}.newline`, { type: 'checkbox' })}
    />
  </>
  )
}
