import { TextInput } from '@mantine/core'
import { IconFileMinus } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function FileDelete( { form, path, templateProps }: actionProps ) {
  return (
  <>
    <TextInput
        label="Target File" withAsterisk
        description="Path of file to be deleted."
        placeholder="D:/templates/ouput/{{username}}.pdf"
        leftSection={<IconFileMinus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
  </>
  )
}
