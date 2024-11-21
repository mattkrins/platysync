import { IconFolderSymlink, IconFolderX } from '@tabler/icons-react'
import ExtTextInput from '../../../../../components/ExtTextInput'
import { operationProps } from '../operations'

export default function FolderMove( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.source}
        label="Source Folder"
        description="Path of folder to be moved."
        leftSection={<IconFolderX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="D:/source/{{username}}/"
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
