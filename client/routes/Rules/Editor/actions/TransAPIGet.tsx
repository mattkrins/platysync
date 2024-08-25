import { TextInput, Input, SegmentedControl } from '@mantine/core'
import { IconWorld } from '@tabler/icons-react'
import SecurePasswordInput from '../../../../components/SecurePasswordInput'
import { actionProps } from '../../../../modules/actions'
import usePassword from '../../../../hooks/usePassword';

export default function TransAPIGet( { form, path, templateProps, config }: actionProps ) {
    const { visible, options, secure, unlock } = usePassword(form, `${path}.password`);
    const auth = form.getInputProps(`${path}.auth`);
    return (
    <>
        <TextInput withAsterisk={!config}
            label="Base API endpoint URL" mt="md"
            description="Prepended to all API target URLs."
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="https://service.com/api/v1"
            {...templateProps(form, `${path}.endpoint`)}
        />
        <Input.Wrapper mt="xs" mb="xs" label="Authentication" withAsterisk={!config} >
            <SegmentedControl fullWidth 
            {...templateProps(form, `${path}.auth`)}
            defaultValue="none"
            data={[
                { label: 'None', value: 'none' },
                { label: 'Basic', value: 'basic' },
                { label: 'Bearer Token', value: 'bearer' },
            ]} />
        </Input.Wrapper>
        {auth.value!=="none"&&
        <SecurePasswordInput withAsterisk={!config}
        label="Password" 
        placeholder={auth.value==="basic"?"username:password":"secret"}
        visible={visible}
        secure={secure}
        unlock={unlock}
        rightSectionX={options.buttons}
        {...templateProps(form, `${path}.password`, options)}
      />}
        <TextInput
            label="Append Query"
            description="Appended to all API target URLs (added to query string)."
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="access_token=secret"
            {...templateProps(form, `${path}.append`)}
        />
    </>
  )
}
