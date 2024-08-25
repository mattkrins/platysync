import { TextInput } from '@mantine/core'
import { IconFileUpload } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'

export default function StmcUpStuPassBulk( { form, path, templateProps, config }: actionProps ) {
    return (
    <>
        <TextInput mt="sm"
            label="CSV Path" withAsterisk
            description="Source path of student_bulk_password_reset.csv"
            placeholder="D:/passwords/{{year}}/student_bulk_password_reset.csv"
            leftSection={<IconFileUpload size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${path}.source`)}
        />
    </>
  )
}
