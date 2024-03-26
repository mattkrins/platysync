import { Box, TextInput } from "@mantine/core";
import { IconFilePlus, IconTemplate } from "@tabler/icons-react";

export default function WritePDF( { inputProps }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Source File" withAsterisk
            description="Path of file to use as template."
            placeholder="D:/templates/input/user_template.pdf"
            leftSection={<IconTemplate size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...inputProps('source')}
        />
        <TextInput
            label="Target File" withAsterisk
            description="Path of file to be written."
            placeholder="D:/templates/ouput/{{username}}.pdf"
            leftSection={<IconFilePlus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...inputProps('target')}
        />
    </Box>
    )
}
