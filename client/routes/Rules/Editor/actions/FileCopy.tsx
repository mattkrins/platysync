import { TextInput } from '@mantine/core'
import { IconFileDownload, IconFileSymlink } from '@tabler/icons-react'
import { actionOptions } from '../../../../modules/actions'

export default function FileCopy( { form, path, templateProps }: actionOptions ) {
  return (
  <>
    <TextInput
        label="Source File" withAsterisk
        description="Path of original file to be copied."
        placeholder="D:/source/{{username}}.txt"
        leftSection={<IconFileDownload size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.source`)}
    />
    <TextInput
        label="Target File" withAsterisk
        description="Destination path where copy will be placed."
        placeholder="E:/destination/{{username}}.txt"
        leftSection={<IconFileSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
  </>
  )
}
