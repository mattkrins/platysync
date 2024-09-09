import { TextInput } from '@mantine/core'
import { IconFileDownload, IconFileSymlink } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function FileCopy( { form, path, templateProps, config }: actionProps ) {
  return (
  <>
    <TextInput
        label="Source File" withAsterisk={!config}
        description="Path of original file to be copied."
        placeholder="D:/source/{{username}}.txt"
        leftSection={<IconFileDownload size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.source`)}
    />
    <TextInput
        label="Target File" withAsterisk={!config}
        description="Destination path where copy will be placed."
        placeholder="E:/destination/{{username}}.txt"
        leftSection={<IconFileSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
  </>
  )
}
