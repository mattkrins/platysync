import { TextInput } from '@mantine/core'
import { IconFolderDown, IconFolderSymlink } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function FolderCopy( { form, path, templateProps, config }: actionProps ) {
  return (
  <>
    <TextInput
        label="Source Folder" withAsterisk={!config}
        description="Path of original folder to be copied."
        placeholder="D:/source/public/"
        leftSection={<IconFolderDown size={16} style={{ display: 'block', opacity: 0.8 }}/>}
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
