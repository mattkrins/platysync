import { TextInput } from '@mantine/core'
import { IconFolderSymlink, IconFolderX } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function FolderMove( { form, path, templateProps, config }: actionProps ) {
  return (
  <>
    <TextInput
        label="Source Folder" withAsterisk={!config}
        description="Path of folder to be moved."
        placeholder="D:/source/{{username}}/"
        leftSection={<IconFolderX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.source`)}
    />
    <TextInput
        label="Target Folder" withAsterisk={!config}
        description="Destination path where copy will be placed."
        placeholder="E:/destination/{{username}}/"
        leftSection={<IconFolderSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
  </>
  )
}
