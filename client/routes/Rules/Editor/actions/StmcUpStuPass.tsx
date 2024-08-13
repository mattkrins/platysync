import { ActionIcon, PasswordInput, TextInput } from '@mantine/core'
import { IconEye, IconEyeOff, IconFolderSymlink, IconFolderX } from '@tabler/icons-react'
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
        label="Match Eduhub" description="Match against eduhub making the _stkey header available."
        />
        <TextInput
            label="DN" withAsterisk
            description="Path of folder to be moved."
            placeholder="D:/source/{{username}}/"
            leftSection={<IconFolderX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${path}.dn`)}
        />
        <PasswordInput
            label="Password" withAsterisk
            description="Destination path where copy will be placed."
            placeholder="E:/destination/{{username}}/" visible={visible}
            leftSection={<IconFolderSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${path}.password`, { buttons: EyeIcon })}
        />
    </>
  )
}
