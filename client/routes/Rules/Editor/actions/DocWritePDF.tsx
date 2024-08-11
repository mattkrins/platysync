import { TextInput } from '@mantine/core'
import { IconTemplate, IconFilePlus, IconSeparatorVertical } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'
import Concealer from '../../../../components/Concealer'

export default function DocWritePDF( { form, path, templateProps }: actionProps ) {
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
    <Concealer>
      <TextInput
          label="Field name separator"
          description="Replaces __ seprator in field__text  field__qr."
          placeholder="__"
          leftSection={<IconSeparatorVertical size={16} style={{ display: 'block', opacity: 0.8 }}/>}
          {...templateProps(form, `${path}.separator`)}
      />
    </Concealer>
  </>
  )
}
