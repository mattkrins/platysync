import { TextInput } from '@mantine/core'
import { IconFolderSymlink, IconFolderX } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'
import SelectConnector from '../../../../components/SelectConnector'

export default function FolderMove( { form, path, templateProps }: actionProps ) {
  return (
  <>
    <SelectConnector mt="sm"
    {...form.getInputProps('eduhub')} ids={["csv"]} clearable
    label="Match Eduhub" description="Match against eduhub making the _stkey header available."
    />
    <TextInput
        label="Source Folder" withAsterisk
        description="Path of folder to be moved."
        placeholder="D:/source/{{username}}/"
        leftSection={<IconFolderX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.source`)}
    />
    <TextInput
        label="Target Folder" withAsterisk
        description="Destination path where copy will be placed."
        placeholder="E:/destination/{{username}}/"
        leftSection={<IconFolderSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
  </>
  )
}
