import { IconFileDownload, IconFileSymlink } from '@tabler/icons-react'
import ExtTextInput from '../../../../../components/ExtTextInput'
import { operationProps } from '../operations'

export default function FileCopy( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.source}
        label="Source File"
        description="Path of original file to be copied."
        leftSection={<IconFileDownload size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="D:/source/{{username}}.txt"
        {...props("source")}
    />
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.target}
        label="Target File" mt="xs"
        description="Destination path where copy will be placed."
        leftSection={<IconFileSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="E:/destination/{{username}}.txt"
        {...props("target")}
    />
  </>
  )
}
