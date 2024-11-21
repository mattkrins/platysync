import { Switch } from '@mantine/core'
import { IconFolderPlus } from '@tabler/icons-react'
import ExtTextInput from '../../../../../components/ExtTextInput'
import { operationProps } from '../operations'

export default function FolderCreate( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.target}
        label="Target Folder"
        description="Path of folder to be created."
        leftSection={<IconFolderPlus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="D:/source/{{username}}/"
        {...props("target")}
    />
    <Switch
      label="Recursive"
      description="All parent folders in the path will be created if they do not already exist."
      mt="xs"
      {...props("recursive", { type: 'checkbox' })}
    />
  </>
  )
}
