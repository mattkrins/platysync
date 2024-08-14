import { ActionIcon, PasswordInput, TextInput } from '@mantine/core'
import { IconEye, IconEyeOff, IconFolderSymlink, IconFolderX, IconKey } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'
import SelectConnector from '../../../../components/SelectConnector'
import { useRule } from '../Editor';
import { useDisclosure } from '@mantine/hooks';

export default function StmcUpStuPass( { form, path, templateProps }: actionProps ) {
    const { sources } = useRule(form);
    const [visible, { toggle }] = useDisclosure(false);
    const EyeIcon = <ActionIcon onClick={toggle} variant="subtle">{!visible ?
        <IconEye style={{ width: 'var(--psi-icon-size)', height: 'var(--psi-icon-size)' }} /> :
        <IconEyeOff style={{ width: 'var(--psi-icon-size)', height: 'var(--psi-icon-size)' }} />}
    </ActionIcon>;
    return (
    <>
        <SelectConnector mt="sm" defaultValue={''}
        {...form.getInputProps(`${path}.connector`)} ids={["stmc"]} names={sources} clearable
        label="Target Connector"
        />
        <TextInput
            label="DN Path" withAsterisk
            description="Distinguished Name of student in education directory."
            placeholder="CN=Student Name,OU=Accounts,DC=services,DC=education,DC=vic,DC=gov,DC=au"
            leftSection={<IconFolderX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${path}.dn`)}
        />
        <PasswordInput
            label="Password" withAsterisk
            description="Password to set for student."
            placeholder="Password" visible={visible}
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${path}.password`, { buttons: EyeIcon })}
        />
    </>
  )
}
