import { TextInput } from '@mantine/core'
import { IconTemplate, IconFilePlus, IconSeparatorVertical } from '@tabler/icons-react'
import Concealer from '../../../../../components/Concealer'
import ExtTextInput from '../../../../../components/ExtTextInput';
import { operationProps } from '../operations';

export default function DocWritePDF( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule}
        label="Source File" withAsterisk={!blueprint?.source}
        description="Path of PDF to use as template."
        leftSection={<IconTemplate size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="D:/templates/input/user_template.pdf"
        {...props("source")}
    />
    <ExtTextInput rule={rule}
        label="Target File" withAsterisk={!blueprint?.target}
        description="Path of PDF to be written."
        leftSection={<IconFilePlus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="D:/templates/ouput/{{username}}.pdf"
        {...props("target")}
    />
    <Concealer>
      <TextInput
          label="Field name separator"
          description="Replaces __ seprator in field__text  field__qr."
          leftSection={<IconSeparatorVertical size={16} style={{ display: 'block', opacity: 0.8 }}/>}
          placeholder="__"
          {...props("separator")}
      />
    </Concealer>
  </>
  )
}
