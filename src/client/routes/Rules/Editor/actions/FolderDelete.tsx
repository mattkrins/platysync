import { TextInput } from '@mantine/core'
import { IconFileMinus } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function FolderDelete( { form, path, templateProps }: actionProps ) {
  return (
  <>
    <TextInput
        label="Target Folder" withAsterisk
        description="Path of folder to be deleted."
        placeholder="D:/temp/{{username}}/"
        leftSection={<IconFileMinus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
  </>
  )
}
