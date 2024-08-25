import { Switch, TextInput, Textarea } from '@mantine/core'
import { IconFilePencil } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function FileWriteTxt( { form, path, templateProps, config }: actionProps ) {
  return (
  <>
    <TextInput
        label="Target File" withAsterisk={!config}
        description="Path of file to append text to."
        placeholder="D:/{{group}}/rows.csv"
        leftSection={<IconFilePencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
    <Textarea mt="xs"
        label="Data" withAsterisk={!config}
        description="Text to append to target file."
        placeholder="{{id}},false,0"
        {...templateProps(form, `${path}.data`)}
    />
    <Switch label="Append New Line" description="Adds a newline/return after writing data."
    mt="xs" {...form.getInputProps(`${path}.newline`, { type: 'checkbox' })}
    />
    <Switch label="Close File" description="Releases file handle after writing instead of rule finalization."
    mt="xs" {...form.getInputProps(`${path}.close`, { type: 'checkbox' })}
    />
  </>
  )
}
