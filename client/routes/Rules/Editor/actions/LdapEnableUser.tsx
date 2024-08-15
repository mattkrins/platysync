import { TextInput } from '@mantine/core'
import { IconFileUpload } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'
import { useRule } from '../Editor';
import SelectActionConnector from '../../../../components/SelectActionConnector';

export default function LdapEnableUser( { form, path, templateProps }: actionProps ) {
    const { sources } = useRule(form);
    return (
    <>
        <SelectActionConnector
        {...form.getInputProps(`${path}.connector`)} ids={["stmc"]} names={sources}
        form={form} path={`${path}.connector`}
        />
    </>
  )
}
