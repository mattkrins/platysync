import { ActionIcon, Box, NumberInput, PasswordInput, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBraces, IconEye, IconEyeOff, IconKey, IconLock, IconPencil } from "@tabler/icons-react";

export default function SysEncryptString( { form, index, inputProps, actionType }: ActionItem ) {
    const [visible, { toggle }] = useDisclosure(false);
    const EyeIcon = <ActionIcon onClick={toggle} variant="subtle">{!visible ?
        <IconEye style={{ width: 'var(--psi-icon-size)', height: 'var(--psi-icon-size)' }} /> :
        <IconEyeOff style={{ width: 'var(--psi-icon-size)', height: 'var(--psi-icon-size)' }} />}
    </ActionIcon>;
    const {rightSection, ...password} = inputProps('password');
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Secret" withAsterisk
            description="String to be encrypted."
            placeholder="My very important secret"
            leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...inputProps('source')}
        />
        <PasswordInput
            label="Encryption Key" withAsterisk mt="xs"
            description={<>String to encrypt the secret with. <b>Warning: this is stored in clear text</b></>}
            placeholder="password"
            visible={visible}
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...password}
            rightSection={<ActionIcon.Group>{EyeIcon}{rightSection}</ActionIcon.Group>}
            rightSectionWidth={"calc(var(--psi-icon-size) * 4)"}
        />
        <NumberInput mt="xs" withAsterisk
            label="Encryption Strength"
            description={<>How many <a href="https://en.wikipedia.org/wiki/PBKDF2" target="_blank" >C</a> iterations to use. Direct trade-off between speed and stength of security. </>}
            placeholder="1000"
            leftSection={<IconLock size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            min={100}
            defaultValue={100}
            {...form.getInputProps(`${actionType}.${index}.value`)}
        />
        <TextInput
            label="Template Key" withAsterisk mt="xs"
            description="Encrypted string will be stored in this template key."
            placeholder="encrypted"
            leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...inputProps('target')}
        />
    </Box>
    )
}
