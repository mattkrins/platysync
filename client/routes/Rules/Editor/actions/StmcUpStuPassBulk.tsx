import { TextInput } from '@mantine/core'
import { IconFileUpload } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'
import SelectConnector from '../../../../components/SelectConnector'
import { useRule } from '../Editor';

export default function StmcUpStuPassBulk( { form, path, templateProps }: actionProps ) {
    const { sources } = useRule(form);
    return (
    <>
        <SelectConnector mt="sm" defaultValue={''}
        {...form.getInputProps(`${path}.connector`)} ids={["stmc"]} names={sources} clearable
        label="Target Endpoint"
        />
        <TextInput
            label="CSV Path" withAsterisk
            description="Source path of student_bulk_password_reset.csv"
            placeholder="D:/passwords/{{year}}/student_bulk_password_reset.csv"
            leftSection={<IconFileUpload size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${path}.source`)}
        />
    </>
  )
}
