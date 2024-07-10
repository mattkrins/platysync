import { TextInput } from '@mantine/core'
import { IconFileSymlink, IconFileX } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function FileMove( { form, path, templateProps }: actionProps ) {
  return (
  <>
    <TextInput
        label="Source File" withAsterisk
        description="Path of file to be moved."
        placeholder="D:/source/{{username}}.txt"
        leftSection={<IconFileX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.source`)}
    />
    <TextInput
        label="Target File" withAsterisk
        description="Destination path where file will be placed."
        placeholder="E:/destination/{{username}}.txt"
        leftSection={<IconFileSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
  </>
  )
}
