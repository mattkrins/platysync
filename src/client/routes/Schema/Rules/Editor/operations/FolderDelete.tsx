import { IconFileMinus } from '@tabler/icons-react'
import ExtTextInput from '../../../../../components/ExtTextInput'
import { operationProps } from '../operations'

export default function FolderDelete( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.target}
        label="Target Folder"
        description="Path of folder to be deleted."
        leftSection={<IconFileMinus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="D:/temp/{{username}}/"
        {...props("target")}
    />
  </>
  )
}
