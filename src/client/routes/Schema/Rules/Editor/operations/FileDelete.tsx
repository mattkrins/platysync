import { IconFileMinus } from '@tabler/icons-react'
import ExtTextInput from '../../../../../components/ExtTextInput'
import { operationProps } from '../operations'

export default function FileDelete( { props, rule, blueprint }: operationProps ) {
  return (
  <>
    <ExtTextInput rule={rule} withAsterisk={!blueprint?.target}
        label="Target File"
        description="Path of file to be deleted."
        leftSection={<IconFileMinus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        placeholder="D:/templates/ouput/{{username}}.pdf"
        {...props("target")}
    />
  </>
  )
}
