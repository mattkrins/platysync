import { Box, Switch, TextInput } from "@mantine/core";
import { IconFileMinus } from "@tabler/icons-react";

export default function DeleteFile( { form, index, explorer, actionType }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Target File" withAsterisk
            description="Path of file to be deleted."
            placeholder="D:/templates/ouput/{{username}}.pdf"
            {...form.getInputProps(`${actionType}.${index}.target`)}
            leftSection={<IconFileMinus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('target')}
        />
        <Switch label="Validate Path"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.validate`, { type: 'checkbox' })}
        />
    </Box>
    )
}
