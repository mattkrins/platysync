import { IconFileUpload } from '@tabler/icons-react'
import ExtTextInput from '../../../../../components/ExtTextInput'
import { operationProps } from '../operations'

export default function StmcUpStuPassBulk( { props, rule, blueprint }: operationProps ) {
    return (
    <>
        <ExtTextInput rule={rule} withAsterisk={!blueprint?.source}
            label="CSV Path"
            description="Source path of student_bulk_password_reset.csv"
            leftSection={<IconFileUpload size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="D:/passwords/{{year}}/student_bulk_password_reset.csv"
            {...props("source")}
        />
    </>
  )
}
