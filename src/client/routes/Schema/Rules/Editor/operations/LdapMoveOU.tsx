import { IconFolder } from '@tabler/icons-react';
import ExtTextInput from '../../../../../components/ExtTextInput';
import { operationProps } from '../operations';

export default function LdapMoveOU( { props, rule, blueprint }: operationProps ) {
    return (
    <>
        <ExtTextInput rule={rule} withAsterisk={!blueprint?.ou}
            label="Target Organizational Unit" pt="xs"
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="ou={{faculty}},ou=child,ou=parent"
            {...props("ou")}
        />
    </>
  )
}
