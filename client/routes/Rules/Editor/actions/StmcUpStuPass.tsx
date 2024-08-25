import { ActionIcon, PasswordInput, TextInput } from '@mantine/core'
import { IconEye, IconEyeOff, IconFolderX, IconKey } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'
import { useDisclosure } from '@mantine/hooks';

export default function StmcUpStuPass( { form, path, templateProps, config }: actionProps ) {
    const [visible, { toggle }] = useDisclosure(false);
    const EyeIcon = <ActionIcon onClick={toggle} variant="subtle">{!visible ?
        <IconEye style={{ width: 'var(--psi-icon-size)', height: 'var(--psi-icon-size)' }} /> :
        <IconEyeOff style={{ width: 'var(--psi-icon-size)', height: 'var(--psi-icon-size)' }} />}
    </ActionIcon>;
    return (
    <>
        <TextInput mt="sm"
            label="DN Path" withAsterisk={!config}
            description="Distinguished Name of student in education directory."
            placeholder="CN=Student Name,OU=Accounts,DC=services,DC=education,DC=vic,DC=gov,DC=au"
            leftSection={<IconFolderX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${path}.dn`)}
        />
        <PasswordInput mt="sm"
            label="Password" withAsterisk={!config}
            description="Password to set for student."
            placeholder="Password" visible={visible}
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${path}.password`, { buttons: EyeIcon })}
        />
    </>
  )
}
