import { Box, TextInput } from "@mantine/core";
import { IconFilePlus, IconTemplate } from "@tabler/icons-react";

export default function WritePDF( { form, index, explorer, actionType }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Source File" withAsterisk
            description="Path of file to use as template."
            placeholder="D:/templates/input/user_template.pdf"
            leftSection={<IconTemplate size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...form.getInputProps(`${actionType}.${index}.source`)}
            rightSection={explorer('source')}
        />
        <TextInput
            label="Target File" withAsterisk
            description="Path of file to be written."
            placeholder="D:/templates/ouput/{{username}}.pdf"
            {...form.getInputProps(`${actionType}.${index}.target`)}
            leftSection={<IconFilePlus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('target')}
        />
    </Box>
    )
}
