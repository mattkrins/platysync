import { IconFolderDown, IconFolderSymlink } from '@tabler/icons-react'
import ExtTextInput from '../../../../../components/ExtTextInput'
import { operationProps } from '../operations'

export default function FolderCopy( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.target}
        label="Source Folder"
        description="Path of original folder to be copied."
        leftSection={<IconFolderDown size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="D:/source/public/"
        {...props("source")}
    />
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.target}
        label="Target Folder"
        description="Destination path where copy will be placed."
        leftSection={<IconFolderSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="E:/destination/{{username}}/"
        {...props("target")}
    />
  </>
  )
}
