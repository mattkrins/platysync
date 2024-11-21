import { PasswordInput } from '@mantine/core'
import { IconFolderX, IconKey } from '@tabler/icons-react'
import ExtTextInput from '../../../../../components/ExtTextInput';
import { operationProps } from '../operations';

export default function StmcUpStuPass( { props, rule, blueprint }: operationProps ) {
    return (
    <>
        <ExtTextInput rule={rule} withAsterisk={!blueprint?.dn}
            label="DN Path"
            description="Distinguished Name of student in education directory."
            leftSection={<IconFolderX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="CN=Student Name,OU=Accounts,DC=services,DC=education,DC=vic,DC=gov,DC=au"
            {...props("dn")}
        />
        <PasswordInput withAsterisk={!blueprint?.password}
            label="Password" mt="sm"
            description="Password to set for student."
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="Password"
            {...props("password", { type: 'password' })}
        />
    </>
  )
}
