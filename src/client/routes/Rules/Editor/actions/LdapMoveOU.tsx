import { actionProps } from '../../../../modules/actions'
import { TextInput } from '@mantine/core';
import { IconFolder } from '@tabler/icons-react';

export default function LdapMoveOU( { form, path, templateProps }: actionProps ) {
    return (
    <>
        <TextInput
            label="Organizational Unit" withAsterisk pt="xs"
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="ou={{faculty}},ou=child,ou=parent"
            {...templateProps(form, `${path}.ou`)}
        />
    </>
  )
}
