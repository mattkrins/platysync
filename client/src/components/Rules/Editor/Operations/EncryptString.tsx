import { Box, NumberInput, PasswordInput, TextInput } from "@mantine/core";
import { IconBraces, IconKey, IconLock, IconPencil } from "@tabler/icons-react";

export default function EncryptString( { form, index, explorer, actionType }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Secret" withAsterisk
            description="String to be encrypted."
            placeholder="My very important secret"
            {...form.getInputProps(`${actionType}.${index}.source`)}
            leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('source')}
        />
        <PasswordInput
            label="Encryption Key" withAsterisk mt="xs"
            description={<>String to encrypt the secret with. <b>Warning: this is stored in clear text</b></>}
            placeholder="password"
            {...form.getInputProps(`${actionType}.${index}.password`)}
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('password')}
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
            {...form.getInputProps(`${actionType}.${index}.target`)}
            leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('target')}
        />
    </Box>
    )
}
