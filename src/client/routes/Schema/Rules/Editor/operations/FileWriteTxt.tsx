import { Switch, Textarea, TextareaProps } from '@mantine/core'
import { IconFilePencil } from '@tabler/icons-react'
import ExtTextInput from '../../../../../components/ExtTextInput'
import { operationProps } from '../operations'

export default function FileWriteTxt( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.source}
        label="Target File"
        description="Path of file to append text to."
        leftSection={<IconFilePencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="D:/{{group}}/rows.csv"
        {...props("target")}
    />
    <ExtTextInput<TextareaProps> Component={Textarea} rule={rule} withAsterisk={!blueprint?.data}
        label="Data" mt="xs" autosize
        description="Text to append to target file."
        leftSection={<IconFilePencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="{{id}},false,0"
        {...props("data")}
    />
    <Switch label="Append New Line" description="Adds a newline/return after writing data."
    mt="xs" {...props("newline", { type: 'checkbox' })}
    />
    <Switch label="Close File" description="Releases file handle after writing instead of rule finalization."
    mt="xs" {...props("close", { type: 'checkbox' })}
    />
  </>
  )
}
