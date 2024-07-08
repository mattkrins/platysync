import { TextInput } from '@mantine/core'
import { IconTemplate, IconFilePlus } from '@tabler/icons-react'
import { actionOptions } from '../../../../modules/actions'

export default function DocWritePDF( { form, path, templateProps }: actionOptions ) {
  return (
  <>
    <TextInput
        label="Source File" withAsterisk
        description="Path of PDF to use as template."
        placeholder="D:/templates/input/user_template.pdf"
        leftSection={<IconTemplate size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.source`)}
    />
    <TextInput
        label="Target File" withAsterisk
        description="Path of PDF to be written."
        placeholder="D:/templates/ouput/{{username}}.pdf"
        leftSection={<IconFilePlus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...templateProps(form, `${path}.target`)}
    />
  </>
  )
}
