import { Box, Switch, TextInput } from "@mantine/core";
import { IconFileMinus } from "@tabler/icons-react";

export default function DeleteFolder( { form, index, explorer }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Target Folder" withAsterisk
            description="Path of folder to be deleted."
            placeholder="D:/temp/{{username}}/"
            {...form.getInputProps(`actions.${index}.target`)}
            leftSection={<IconFileMinus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('target')}
        />
        <Switch label="Validate Path"
        mt="xs" {...form.getInputProps(`actions.${index}.validate`, { type: 'checkbox' })}
        />
    </Box>
    )
}
