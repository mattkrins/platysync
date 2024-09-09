import { Switch, TextInput } from '@mantine/core'
import { IconFolderPlus } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function FolderCreate( { form, path, templateProps, config }: actionProps ) {
  return (
  <>
    <TextInput
        label="Target Folder" withAsterisk={!config}
        description="Path of folder to be created."
        placeholder="D:/source/{{username}}/"
        leftSection={<IconFolderPlus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
    <Switch label="Recursive"
        description="All parent folders in the path will be created if they do not already exist."
        mt="xs" {...form.getInputProps(`${path}.recursive`, { type: 'checkbox' })}
    />
  </>
  )
}
